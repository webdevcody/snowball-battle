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
  canFire: boolean;
};

type Snowball = {
  id: number;
  x: number;
  y: number;
};

const SERVER_TICK_RATE = 20;

function calculateInterpolationFactor(frameRate) {
  const effectiveTickRate = Math.max(SERVER_TICK_RATE, 1);
  const idealFrameTime = 1 / frameRate;
  const interpolationFactor = idealFrameTime * effectiveTickRate;
  return Math.min(Math.max(interpolationFactor, 0), 1);
}

export async function start({
  roomId,
  onScoresUpdated,
  onGameOver,
  onDisconnect,
  onTimeLeft,
  playerIdRef,
  setLatency,
}: {
  roomId: string;
  onScoresUpdated: (newScores: Score[]) => void;
  onGameOver: (winner: string) => void;
  onDisconnect: () => void;
  onTimeLeft: (timeLeft: number) => void;
  setLatency: (latency: number) => void;
  playerIdRef: MutableRefObject<any>;
}) {
  let isRunning = true;
  const connectionInfo = await getConnectionInfo(roomId);

  let mouseX = 0;
  let mouseY = 0;

  const websocketUrl = `${USE_LOCAL_WS ? "ws://" : "wss://"}${
    connectionInfo.exposedPort?.host
  }:${
    connectionInfo.exposedPort?.port
  }?roomId=${roomId}&nickname=${getNickname()}`;

  const mapImage = new Image();
  mapImage.src = "/snowy-sheet.png";

  const santaImage = new Image();
  santaImage.src = "/santa.png";

  const crosshair = new Image();
  crosshair.src = "/crosshair.png";

  const crosshairArmed = new Image();
  crosshairArmed.src = "/crosshair-armed.png";

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
  let snowballs: Snowball[] = [];
  let isFirstPlayersEvent = true;

  const TILE_SIZE = 32;
  const SNOWBALL_RADIUS = 5;
  const playerInterpolations = new Map<
    string,
    {
      x: number;
      y: number;
    }
  >();
  const snowballInterpolations = new Map<
    number,
    {
      x: number;
      y: number;
    }
  >();

  function getMyPlayer() {
    return players.find((p) => p.id === socket.id);
  }

  function refreshScores() {
    const newScores: Score[] = players.map((player) => ({
      kills: player.kills,
      deaths: player.deaths,
      player: player.id,
      nickname: player.nickname,
    }));
    onScoresUpdated(newScores);
  }

  let pingStart = Date.now();

  let pingInterval = setInterval(() => {
    pingStart = Date.now();
    socket.emit("ping");
  }, 1000);

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

  socket.on("pong", () => {
    setLatency(Date.now() - pingStart);
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

  window.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
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

  let lastUpdate = Date.now();
  function loop() {
    const delta = Date.now() - lastUpdate;
    const interpolationFactor = calculateInterpolationFactor(
      Math.floor(1000 / delta)
    );

    const maxIntDist = 100;

    for (const player of players) {
      const interpolation = playerInterpolations.get(player.id);

      const startX = interpolation ? interpolation.x : player.x;
      const startY = interpolation ? interpolation.y : player.y;

      playerInterpolations.set(player.id, {
        x:
          Math.abs(player.x - startX) > maxIntDist
            ? player.x
            : startX + interpolationFactor * (player.x - startX),
        y:
          Math.abs(player.y - startY) > maxIntDist
            ? player.y
            : startY + interpolationFactor * (player.y - startY),
      });
    }

    for (const snowball of snowballs) {
      const interpolation = snowballInterpolations.get(snowball.id);

      const startX = interpolation ? interpolation.x : snowball.x;
      const startY = interpolation ? interpolation.y : snowball.y;

      snowballInterpolations.set(snowball.id, {
        x:
          Math.abs(snowball.x - startX) > maxIntDist
            ? snowball.x
            : startX + interpolationFactor * (snowball.x - startX),
        y:
          Math.abs(snowball.y - startY) > maxIntDist
            ? snowball.y
            : startY + interpolationFactor * (snowball.y - startY),
      });
    }

    const myPlayer = players.find((player) => player.id === socket.id);
    let cameraX = 0;
    let cameraY = 0;
    if (myPlayer) {
      const interpolation = playerInterpolations.get(myPlayer.id)!;
      cameraX = Math.floor(interpolation.x - canvasEl.width / 2);
      cameraY = Math.floor(interpolation.y - canvasEl.height / 2);
    }

    canvas.clearRect(0, 0, canvasEl.width, canvasEl.height);

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
      const interpolation = playerInterpolations.get(player.id)!;
      canvas.drawImage(
        player.isLeft ? santaLeftImage : santaImage,
        interpolation.x - cameraX,
        interpolation.y - cameraY
      );
    }

    for (const snowball of snowballs) {
      const interpolation = snowballInterpolations.get(snowball.id)!;
      canvas.fillStyle = "#ff0039";
      canvas.beginPath();
      canvas.arc(
        interpolation.x - cameraX,
        interpolation.y - cameraY,
        SNOWBALL_RADIUS,
        0,
        2 * Math.PI
      );
      canvas.fill();
    }

    canvas.drawImage(
      getMyPlayer()?.canFire ? crosshairArmed : crosshair,
      mouseX - 16,
      mouseY - 16
    );

    lastUpdate = Date.now();

    if (isRunning) {
      window.requestAnimationFrame(loop);
    }
  }

  window.requestAnimationFrame(loop);

  return {
    cleanup() {
      clearInterval(pingInterval);
      isRunning = false;
      socket.disconnect();
    },
  };
}
