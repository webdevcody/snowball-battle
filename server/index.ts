import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { loadMap } from "./mapLoader";
import { updateLobbyState } from "./models/lobby";
import { destroyRoom, getRoomInfo } from "./models/room";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 8000;

const SPEED = 3;
const TICK_RATE = 60;
const SNOWBALL_SPEED = 10;
const PLAYER_SIZE = 32;
const TILE_SIZE = 32;

type PlayerId = string;

type Player = {
  id: PlayerId;
  x: number;
  y: number;
  kills: number;
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
const inputsMap = {};
let ground2D, decal2D;

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
            x: col * TILE_SIZE,
            y: row * TILE_SIZE,
            w: TILE_SIZE,
            h: TILE_SIZE,
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

    if (inputs.up) {
      player.y -= SPEED;
    } else if (inputs.down) {
      player.y += SPEED;
    }

    if (isCollidingWithMap(player)) {
      player.y = previousY;
    }

    if (inputs.left) {
      player.x -= SPEED;
    } else if (inputs.right) {
      player.x += SPEED;
    }

    if (isCollidingWithMap(player)) {
      player.x = previousX;
    }
  }

  for (const snowball of snowballs) {
    snowball.x += Math.cos(snowball.angle) * SNOWBALL_SPEED;
    snowball.y += Math.sin(snowball.angle) * SNOWBALL_SPEED;
    snowball.timeLeft -= delta;

    for (const player of players) {
      if (player.id === snowball.playerId) continue;
      const distance = Math.sqrt(
        (player.x + PLAYER_SIZE / 2 - snowball.x) ** 2 +
          (player.y + PLAYER_SIZE / 2 - snowball.y) ** 2
      );
      if (distance <= PLAYER_SIZE / 2) {
        player.x = 0;
        player.y = 0;
        snowball.timeLeft = -1;
        player.deaths++;
        const ownerOfSnowball = getPlayer(snowball.playerId);
        if (ownerOfSnowball) {
          ownerOfSnowball.kills++;

          if (ownerOfSnowball.kills >= roomConfig!.winningScore) {
            io.emit("end", ownerOfSnowball.id);

            setTimeout(async () => {
              await destroyRoom(roomId);
              process.exit(1);
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

    players.push({
      id: socket.id,
      x: 800,
      y: 800,
      kills: 0,
      deaths: 0,
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
