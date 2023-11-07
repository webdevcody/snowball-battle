import io from "socket.io-client";
import { USE_LOCAL_WS } from "@/config";
import { getConnectionInfo } from "@/api/room";
import { Score } from "./page";
import { MutableRefObject } from "react";
import { getNickname } from "@/lib/utils";

type Player = {
  id: string;
  x: number;
  nickname: string;
  y: number;
  isLeft: boolean;
  kills: number;
  deaths: number;
};

export async function start({
  roomId,
  onScoresUpdated,
  onGameOver,
  onDisconnect,
  onTimeLeft,
  playerIdRef,
}: {
  roomId: string;
  onScoresUpdated: (newScores: Score[]) => void;
  onGameOver: (winner: string) => void;
  onDisconnect: () => void;
  onTimeLeft: (timeLeft: number) => void;
  playerIdRef: MutableRefObject<any>;
}) {
  let isRunning = true;
  const connectionInfo = await getConnectionInfo(roomId);

  const websocketUrl = `${USE_LOCAL_WS ? "ws://" : "wss://"}${
    connectionInfo.exposedPort?.host
  }:${
    connectionInfo.exposedPort?.port
  }?roomId=${roomId}&nickname=${getNickname()}`;

  const mapImage = new Image();
  mapImage.src = "/snowy-sheet.png";

  const santaImage = new Image();
  santaImage.src = "/santa.png";

  const santaLeftImage = new Image();
  santaLeftImage.src = "/santa-left.png";

  const walkSnow = new Audio("walk-snow.mp3");

  const canvasEl = document.getElementById("canvas") as HTMLCanvasElement;

  canvasEl.width = window.innerWidth;
  canvasEl.height = window.innerHeight;
  const canvas = canvasEl.getContext("2d")!;

  const socket = io(websocketUrl, {
    transports: ["websocket"],
    upgrade: false,
  });

  let groundMap = [[]];
  let decalMap = [[]];
  let players: Player[] = [];
  let snowballs = [] as {
    x: number;
    y: number;
  }[];
  let isFirstPlayersEvent = true;

  const TILE_SIZE = 32;
  const SNOWBALL_RADIUS = 5;

  function refreshScores() {
    const newScores: Score[] = players.map((player) => ({
      kills: player.kills,
      deaths: player.deaths,
      player: player.id,
      nickname: player.nickname,
    }));
    onScoresUpdated(newScores);
  }

  socket.on("connect", () => {
    playerIdRef.current = socket.id;
  });

  socket.on("refresh", () => {
    refreshScores();
  });

  socket.on("map", (loadedMap) => {
    groundMap = loadedMap.ground;
    decalMap = loadedMap.decal;
  });

  socket.on("end", (winner: string) => {
    socket.disconnect();
    onGameOver(winner);
  });

  socket.on("players", (serverPlayers) => {
    players = serverPlayers;
    if (isFirstPlayersEvent) {
      refreshScores();
    }
    isFirstPlayersEvent = false;
  });

  socket.on("snowballs", (serverSnowballs) => {
    snowballs = serverSnowballs;
  });

  socket.on("death", ({ victim, killer }) => {
    // TODO: show cs:go style of death alert
  });

  socket.on("disconnect", () => {
    onDisconnect();
  });

  socket.on("remaining", (timeLeft: number) => {
    onTimeLeft(timeLeft);
  });

  const inputs = {
    up: false,
    down: false,
    left: false,
    right: false,
  };

  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyW") {
      inputs["up"] = true;
    } else if (e.code === "KeyS") {
      inputs["down"] = true;
    } else if (e.code === "KeyD") {
      inputs["right"] = true;
    } else if (e.code === "KeyA") {
      inputs["left"] = true;
    }
    if (["KeyA", "KeyS", "KeyW", "KeyD"].includes(e.code) && walkSnow.paused) {
      // walkSnow.play();
    }
    socket.emit("inputs", inputs);
  });

  window.addEventListener("keyup", (e) => {
    if (e.code === "KeyW") {
      inputs["up"] = false;
    } else if (e.code === "KeyS") {
      inputs["down"] = false;
    } else if (e.code === "KeyD") {
      inputs["right"] = false;
    } else if (e.code === "KeyA") {
      inputs["left"] = false;
    }
    if (["KeyA", "KeyS", "KeyW", "KeyD"].includes(e.code)) {
      walkSnow.pause();
      walkSnow.currentTime = 0;
    }
    socket.emit("inputs", inputs);
  });

  window.addEventListener("click", (e) => {
    const angle = Math.atan2(
      e.clientY - canvasEl.height / 2 - 16,
      e.clientX - canvasEl.width / 2 - 16
    );
    socket.emit("snowball", angle);
  });

  function loop() {
    canvas.clearRect(0, 0, canvasEl.width, canvasEl.height);

    const myPlayer = players.find((player) => player.id === socket.id);
    let cameraX = 0;
    let cameraY = 0;
    if (myPlayer) {
      cameraX = Math.floor(myPlayer.x - canvasEl.width / 2);
      cameraY = Math.floor(myPlayer.y - canvasEl.height / 2);
    }

    const TILES_IN_ROW = 8;

    // ground
    for (let row = 0; row < groundMap.length; row++) {
      for (let col = 0; col < groundMap[0].length; col++) {
        let { id } = groundMap[row][col];
        const imageRow = Math.floor(id / TILES_IN_ROW);
        const imageCol = id % TILES_IN_ROW;
        canvas.drawImage(
          mapImage,
          imageCol * TILE_SIZE,
          imageRow * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE,
          col * TILE_SIZE - cameraX,
          row * TILE_SIZE - cameraY,
          TILE_SIZE,
          TILE_SIZE
        );
      }
    }

    // decals
    for (let row = 0; row < decalMap.length; row++) {
      for (let col = 0; col < decalMap[0].length; col++) {
        let { id } = decalMap[row][col] ?? { id: undefined };
        const imageRow = Math.floor(id / TILES_IN_ROW);
        const imageCol = id % TILES_IN_ROW;

        canvas.drawImage(
          mapImage,
          imageCol * TILE_SIZE,
          imageRow * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE,
          col * TILE_SIZE - cameraX,
          row * TILE_SIZE - cameraY,
          TILE_SIZE,
          TILE_SIZE
        );
      }
    }

    for (const player of players) {
      canvas.drawImage(
        player.isLeft ? santaLeftImage : santaImage,
        player.x - cameraX,
        player.y - cameraY
      );
    }

    for (const snowball of snowballs) {
      canvas.fillStyle = "#ff0039";
      canvas.beginPath();
      canvas.arc(
        snowball.x - cameraX,
        snowball.y - cameraY,
        SNOWBALL_RADIUS,
        0,
        2 * Math.PI
      );
      canvas.fill();
    }

    if (isRunning) {
      window.requestAnimationFrame(loop);
    }
  }

  window.requestAnimationFrame(loop);

  return {
    cleanup() {
      isRunning = false;
      socket.disconnect();
    },
  };
}
