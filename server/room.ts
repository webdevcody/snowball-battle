import "dotenv/config";
import { destroyRoom, getRoomInfo, updateRoomConfig } from "./models/room";
import { Socket } from "socket.io";
import { maxBy } from "lodash";
import { PLAYER_SIZE, Player } from "./entities/player";
import { MapManager, getRandomSpawn } from "./map/map-manager";
import { Snowball } from "./entities/snowball";

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
    {
      up: boolean;
      down: boolean;
      left: boolean;
      right: boolean;
    }
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

  function broadcast(event: string, payload: any) {
    sockets.forEach((socket) => {
      socket.emit(event, payload);
    });
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
            broadcast("players", players);
            broadcast("refresh", undefined);
          },
        },
        delta
      );
    }
    snowballs = snowballs.filter((snowball) => snowball.timeLeft > 0);

    broadcast("players", players);
    broadcast("snowballs", snowballs);
  }

  async function onConnect(socket: Socket, nickname: string) {
    sockets.push(socket);

    if (players.length >= roomConfig.capacity) {
      socket.disconnect();
      return;
    }

    inputsMap[socket.id] = {
      up: false,
      down: false,
      left: false,
      right: false,
    };

    const spawn = getRandomSpawn();

    const newPlayer = new Player(socket.id, nickname);
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
