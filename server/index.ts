import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { loadMap } from "./mapLoader";
import { updateLobbyState } from "./models/lobby";
import { getRoomInfo } from "./models/room";

const app = express();
const httpServer = createServer(app);

const THROW_DELAY = 500;
const SPAWN_POINTS = [
  {
    x: 813,
    y: 739,
  },
  {
    x: 1161,
    y: 1156,
  },
  {
    x: 1161,
    y: 1891,
  },
  {
    x: 1572,
    y: 2188,
  },
  {
    x: 2313,
    y: 2188,
  },
  {
    x: 2397,
    y: 1555,
  },
  {
    x: 2190,
    y: 859,
  },
  {
    x: 1773,
    y: 1471,
  },
];

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 8000;

const SPEED = 4;
const TICK_RATE = 60;
const SNOWBALL_SPEED = 10;
const PLAYER_SIZE = 32;
const TILE_SIZE = 32;

type PlayerId = string;

type Player = {
  id: PlayerId;
  isLeft: boolean;
  x: number;
  y: number;
  kills: number;
  nickname: string;
  deaths: number;
};

type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type Snowball = {
  x: number;
  y: number;
  angle: number;
  playerId: PlayerId;
  timeLeft: number;
};

let players: Player[] = [];
let snowballs: Snowball[] = [];
const onFireCooldown = new Map<string, boolean>();
const inputsMap = {} as Record<
  string,
  {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  }
>;
let ground2D: {
  id: any;
  gid: any;
}[][];

let decal2D:
  | (
      | {
          id: any;
          gid: any;
        }
      | undefined
    )[][];

function getPlayer(playerId: string) {
  return players.find((p) => p.id === playerId);
}

function isColliding(rect1: Rect, rect2: Rect) {
  return (
    rect1.x < rect2.x + rect2.w &&
    rect1.x + rect1.w > rect2.x &&
    rect1.y < rect2.y + rect2.h &&
    rect1.h + rect1.y > rect2.y
  );
}

function getRandomSpawn() {
  return SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
}

function isCollidingWithMap(player: Player) {
  for (let row = 0; row < decal2D.length; row++) {
    for (let col = 0; col < decal2D[0].length; col++) {
      const tile = decal2D[row][col];

      if (
        tile &&
        isColliding(
          {
            x: player.x,
            y: player.y,
            w: 32,
            h: 32,
          },
          {
            x: col * TILE_SIZE + 10,
            y: row * TILE_SIZE + 10,
            w: TILE_SIZE - 14,
            h: TILE_SIZE - 14,
          }
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

function isCollidingWithTree(snowball: Snowball) {
  const treeIds = [34, 35, 36, 37, 42, 43, 44, 45, 50, 51, 52, 53];
  for (let row = 0; row < decal2D.length; row++) {
    for (let col = 0; col < decal2D[0].length; col++) {
      const tile = decal2D[row][col];
      if (
        tile &&
        treeIds.includes(tile.id) &&
        isColliding(
          {
            x: snowball.x,
            y: snowball.y,
            w: 32,
            h: 32,
          },
          {
            x: col * TILE_SIZE + 10,
            y: row * TILE_SIZE + 10,
            w: TILE_SIZE - 14,
            h: TILE_SIZE - 14,
          }
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

function tick(delta: number) {
  for (const player of players) {
    const inputs = inputsMap[player.id];
    const previousY = player.y;
    const previousX = player.x;

    let playerSpeed = SPEED;

    if ((inputs.up || inputs.down) && (inputs.left || inputs.right)) {
      playerSpeed = SPEED * 0.7071067811865476;
    }

    if (inputs.up) {
      player.y -= playerSpeed;
    } else if (inputs.down) {
      player.y += playerSpeed;
    }

    if (isCollidingWithMap(player)) {
      player.y = previousY;
    }

    if (inputs.left) {
      player.x -= playerSpeed;
      player.isLeft = true;
    } else if (inputs.right) {
      player.x += playerSpeed;
      player.isLeft = false;
    }

    if (isCollidingWithMap(player)) {
      player.x = previousX;
    }
  }

  for (const snowball of snowballs) {
    snowball.x += Math.cos(snowball.angle) * SNOWBALL_SPEED;
    snowball.y += Math.sin(snowball.angle) * SNOWBALL_SPEED;
    snowball.timeLeft -= delta;

    if (isCollidingWithTree(snowball)) {
      snowball.timeLeft = -1;
      continue;
    }

    for (const player of players) {
      if (player.id === snowball.playerId) continue;
      const distance = Math.sqrt(
        (player.x + PLAYER_SIZE / 2 - snowball.x) ** 2 +
          (player.y + PLAYER_SIZE / 2 - snowball.y) ** 2
      );
      if (distance <= PLAYER_SIZE / 2) {
        const spawn = getRandomSpawn();
        player.x = spawn.x;
        player.y = spawn.y;
        snowball.timeLeft = -1;
        player.deaths++;
        const ownerOfSnowball = getPlayer(snowball.playerId);
        if (ownerOfSnowball) {
          ownerOfSnowball.kills++;

          if (ownerOfSnowball.kills >= roomConfig!.winningScore) {
            io.emit("end", ownerOfSnowball.nickname);

            setTimeout(async () => {
              process.exit(0);
            }, 2000);
          }
        }
        io.emit("death", { victim: player, killer: ownerOfSnowball });
        io.emit("players", players);
        io.emit("refresh");

        break;
      }
    }
  }
  snowballs = snowballs.filter((snowball) => snowball.timeLeft > 0);

  io.emit("players", players);
  io.emit("snowballs", snowballs);
}

let roomConfig;
let roomId: string;

async function main() {
  ({ ground2D, decal2D } = await loadMap());

  io.on("connect", async (socket) => {
    if (!roomId) {
      roomId = socket.handshake.query.roomId as string;
    }
    const roomInfo = await getRoomInfo(roomId);

    roomConfig = JSON.parse(roomInfo.roomConfig!);

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

    players.push({
      id: socket.id,
      x: spawn.x,
      y: spawn.y,
      nickname: socket.handshake.query.nickname,
      kills: 0,
      deaths: 0,
      isLeft: false,
    });

    await updateLobbyState(roomId, {
      numberOfPlayers: players.length,
    });

    io.emit("players", players);
    io.emit("refresh");

    socket.emit("map", {
      ground: ground2D,
      decal: decal2D,
    });

    socket.on("inputs", (inputs) => {
      inputsMap[socket.id] = inputs;
    });

    socket.on("snowball", (angle) => {
      const player = getPlayer(socket.id);
      if (!player) return;
      if (onFireCooldown.get(player.id)) return;
      onFireCooldown.set(player.id, true);
      setTimeout(() => {
        onFireCooldown.set(player.id, false);
      }, THROW_DELAY);
      snowballs.push({
        angle,
        x: player.x + PLAYER_SIZE / 2,
        y: player.y + PLAYER_SIZE / 2,
        timeLeft: 1000,
        playerId: socket.id,
      });
    });

    socket.on("disconnect", async () => {
      players = players.filter((player) => player.id !== socket.id);

      await updateLobbyState(roomId, {
        numberOfPlayers: players.length,
      });

      io.emit("players", players);
      io.emit("refresh");
    });
  });

  app.use(express.static("client"));

  httpServer.listen(PORT);

  let lastUpdate = Date.now();
  setInterval(() => {
    const now = Date.now();
    const delta = now - lastUpdate;
    tick(delta);
    lastUpdate = now;
  }, 1000 / TICK_RATE);
}

main();
