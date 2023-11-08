import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { getRoomInfo } from "./models/room";
import { createRoom } from "./room";

const PORT = process.env.PORT || 8000;

async function main() {
  const rooms = new Map<string, any>();
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  io.on("connect", async (socket) => {
    console.log(`Player connected: ${socket.id}`);
    const roomId = socket.handshake.query.roomId as string;
    const nickname = socket.handshake.query.nickname as string;

    if (!rooms.has(roomId)) {
      const roomInfo = await getRoomInfo(roomId);
      const roomConfig = JSON.parse(roomInfo.roomConfig!);
      const room = await createRoom(roomId, roomConfig, () => {
        rooms.delete(roomId);
      });
      rooms.set(roomId, room);
    }

    rooms.get(roomId).onConnect(socket, nickname);

    socket.on("disconnect", async () => {
      console.log(`Player disconnected: ${socket.id}`);
      const room = rooms.get(roomId);
      if (room) {
        room.onDisconnect(socket);
      }
    });

    socket.on("ping", () => {
      socket.emit("pong");
    });
  });

  app.use(express.static("client"));

  httpServer.listen(PORT);

  console.log(`Server running on port ${PORT}`);
}

main();
