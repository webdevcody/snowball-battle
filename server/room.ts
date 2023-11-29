import "dotenv/config";
import { destroyRoom, getRoomInfo, updateRoomConfig } from "./models/room";
import { Socket } from "socket.io";
import { maxBy } from "lodash";
import { PLAYER_SIZE, Player } from "./entities/player";
import { MapManager, getRandomSpawn } from "./map/map-manager";
import { Snowball } from "./entities/snowball";
import { NONE } from "../common/input";

export async function createRoom(
  roomId: string,
  roomConfig: {
    winningScore: number;
    capacity: number;
  },
  onDestroy: () => void
) {
  console.log(`Creating rooms with id of ${roomId}`);

  const THROW_DELAY = 500;
  const GAME_LENGTH = 3 * 60 * 1000;
  let timeLeft = GAME_LENGTH;

  const TICK_RATE = 20;

  const mapManager = await MapManager.create();
  let sockets: Socket[] = [];
  let players: Player[] = [];
  let snowballs: Snowball[] = [];
  const inputsMap = {} as Record<
    string,
    number // TODO(Heath) we can type this better
  >;

  const endTimer = setTimeout(() => {
    if (players.length <= 0) {
      endRoom();
      return;
    }
    const topPlayer = maxBy(players, (p) => p.kills)!;
    declareWinner(topPlayer.nickname);
  }, GAME_LENGTH);

  const remainingInterval = setInterval(() => {
    broadcast("remaining", timeLeft);
  }, 500);

  async function endRoom() {
    console.log(`Ending room of id ${roomId}`);
    clearInterval(remainingInterval);
    clearTimeout(endTimer);
    broadcast("end", "no one");
    await destroyRoom(roomId);
    clearInterval(interval);
    onDestroy();
  }

  function diffObjects(previous: any, current: any) {
    // Assumes that they have the same keys and just checks for differences
    // returning the keys that are different (with new one's values)
    let diff = {};
    for (const key in current) {
      if (previous[key] !== current[key]) {
        diff = {
          ...diff,
          [key]: current[key],
        };
      }
    }
    return diff;
  }

  function broadcast(event: string, payload: any) {
    sockets.forEach((socket) => {
      socket.emit(event, payload);
    });
  }

  const cacheLastBroadcast = new Map<string, any[]>();
  function broadcast_compressed(event: string, payload: {}[]) {
    const lastBroadcast = cacheLastBroadcast.get(event);
    if (lastBroadcast === undefined || lastBroadcast.length === 0) {
      broadcast(event, payload);
      cacheLastBroadcast.set(event, structuredClone(payload));
      return;
    }
    // copy the array so we don't mutate the original
    const newBroadcast = structuredClone(payload);
    const diffArray = lastBroadcast.map((last: any, idx: number) => {
      return diffObjects(last, newBroadcast[idx]);
    });
    if (diffArray.length === 0) return;
    if (diffArray.some((diff: any) => Object.keys(diff).length > 0)) {
      broadcast(event, diffArray);
    }
    cacheLastBroadcast.set(event, newBroadcast);
  }

  function getPlayer(playerId: string) {
    return players.find((p) => p.id === playerId);
  }

  function declareWinner(winner: string) {
    broadcast("end", winner);
    setTimeout(async () => {
      await endRoom();
    }, 3000);
  }

  function tick(delta: number) {
    for (const player of players) {
      player.setInputs(inputsMap[player.id]);
      player.update(
        {
          mapManager,
        },
        delta
      );
    }

    for (const snowball of snowballs) {
      snowball.update(
        {
          mapManager,
          broadcast,
          declareWinner,
          getPlayer,
          getWinningScore: () => roomConfig.winningScore,
          getPlayers: () => players,
          onKill(victim: Player, killer: Player) {
            broadcast("death", {
              victim,
              killer,
            });
            broadcast_compressed("players", players);
            broadcast("refresh", undefined);
          },
        },
        delta
      );
    }
    snowballs = snowballs.filter((snowball) => snowball.timeLeft > 0);

    broadcast_compressed("players", players);
    broadcast("snowballs", snowballs);
  }

  async function onConnect(
    socket: Socket,
    nickname: string,
    santaColor: string
  ) {
    sockets.push(socket);

    if (players.length >= roomConfig.capacity) {
      socket.disconnect();
      return;
    }

    inputsMap[socket.id] = NONE;

    const spawn = getRandomSpawn();

    const newPlayer = new Player(socket.id, nickname, santaColor);
    newPlayer.x = spawn.x;
    newPlayer.y = spawn.y;
    players.push(newPlayer);

    try {
      const room = await getRoomInfo(roomId);
      const config = JSON.parse(room.roomConfig ?? "{}");

      await updateRoomConfig(
        {
          roomConfig: JSON.stringify({
            ...config,
            numberOfPlayers: players.length,
          }),
        },
        roomId
      );
    } catch (err) {
      // lobby was removed, but still let the players play if they want on a private room id
    }

    broadcast("players", players);
    broadcast("refresh", undefined);
    broadcast("remaining", timeLeft);

    socket.emit("map", {
      ground: mapManager.ground,
      decal: mapManager.decals,
    });

    socket.on("inputs", (inputs) => {
      inputsMap[socket.id] = inputs;
    });

    socket.on("snowball", (angle) => {
      const player = getPlayer(socket.id);
      if (!player) return;
      if (!player.canFire) return;
      player.canFire = false;
      setTimeout(() => {
        player.canFire = true;
      }, THROW_DELAY);
      const newSnowball = new Snowball(
        player.x + PLAYER_SIZE / 2,
        player.y + PLAYER_SIZE / 2,
        angle,
        socket.id
      );
      snowballs.push(newSnowball);
    });
  }

  async function onDisconnect(socket: Socket) {
    sockets = sockets.filter((s) => s.id !== socket.id);
    players = players.filter((player) => player.id !== socket.id);
    delete inputsMap[socket.id];

    try {
      const room = await getRoomInfo(roomId);
      const config = JSON.parse(room.roomConfig ?? "{}");

      await updateRoomConfig(
        {
          roomConfig: JSON.stringify({
            ...config,
            numberOfPlayers: players.length,
          }),
        },
        roomId
      );
    } catch (err) {
      // still let players play
    }
    broadcast("players", players);
    broadcast("refresh", undefined);
  }

  // MAIN SERVER ROOM LOOP
  let lastUpdate = Date.now();
  let interval = setInterval(() => {
    const now = Date.now();
    const delta = now - lastUpdate;
    tick(delta);
    timeLeft -= delta;
    lastUpdate = now;
  }, 1000 / TICK_RATE);

  return {
    onConnect,
    onDisconnect,
  };
}
