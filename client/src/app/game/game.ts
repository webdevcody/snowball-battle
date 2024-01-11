import io from "socket.io-client";
import { USE_LOCAL_WS } from "@/config";
import { getConnectionInfo } from "@/api/room";
import { Score } from "./page";
import { MutableRefObject } from "react";
import { getNickname, getSantaColor } from "@/lib/utils";
import { SantaColor } from "@/lib/player-options";
import { UP, DOWN, LEFT, RIGHT, NONE, MoveDirection } from "@common/input";

const SANTA_SPRITE = "/santa-sprite.png";
const SANTA_SPRITE_LEFT = "/santa-sprite-left.png";

const SantaColorToSpriteRow = new Map<SantaColor, number>([
  ["Red", 0],
  ["Blue", 1],
  ["Green", 2],
  ["Yellow", 3],
  ["Purple", 4],
  ["Teal", 5],
]);

type Vec2d = {
  x: number;
  y: number;
};

class Sprite {
  image: HTMLImageElement; // The actual sprite sheet
  spriteDims: Vec2d; // The dimensions of the sprite sheet (width, height)
  frameDims: Vec2d; // The dimensions of a single frame (width, height)
  frameIndex: number; // The index of the current frame
  frameMap: Map<number, Vec2d>; // A map of frame index to coords in sheet
  position: Vec2d; // The position of the sprite on the canvas

  constructor(
    image: HTMLImageElement,
    spriteDims: Vec2d,
    frameDims: Vec2d,
    startIndex: number,
    startingPosition: Vec2d
  ) {
    this.image = image;
    this.spriteDims = spriteDims;
    this.frameDims = frameDims;
    this.frameIndex = startIndex;
    this.position = startingPosition ?? { x: 0, y: 0 };
    this.frameMap = new Map<number, Vec2d>();
  }

  // TODO: decide on i,j, vs x,y vs row,col
  ij_to_flat_index(i: number, j: number) {
    return j * this.spriteDims.x + i;
  }

  buildFrameMap() {
    for (let i = 0; i < this.spriteDims.x; i++) {
      for (let j = 0; j < this.spriteDims.y; j++) {
        this.frameMap.set(this.ij_to_flat_index(i, j), {
          x: i * this.frameDims.x,
          y: j * this.frameDims.y,
        });
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
    const theFrame = this.frameMap.get(frame);
    if (!theFrame) {
      throw new Error(`Could not find frame ${frame}`);
    }
    ctx.drawImage(
      this.image,
      theFrame.x,
      theFrame.y,
      this.frameDims.x,
      this.frameDims.y,
      x,
      y,
      this.frameDims.x,
      this.frameDims.y
    );
  }
}

class Player {
  id: string;
  x: number;
  nickname: string;
  santaColor: SantaColor;
  y: number;
  isLeft: boolean;
  kills: number;
  deaths: number;
  canFire: boolean;
  isWalking: boolean;
  playerSprite: Sprite | null = null;
  playerSpriteLeft: Sprite | null = null;
  interpolation: Vec2d | null = null;

  constructor(
    id: string,
    x: number,
    nickname: string,
    santaColor: SantaColor,
    y: number,
    isLeft: boolean,
    kills: number,
    deaths: number,
    canFire: boolean,
    isWalking: boolean = false
  ) {
    this.id = id;
    this.x = x;
    this.nickname = nickname;
    this.santaColor = santaColor;
    this.y = y;
    this.isLeft = isLeft;
    this.kills = kills;
    this.deaths = deaths;
    this.canFire = canFire;
    this.isWalking = isWalking;
    this.loadSprites();
  }

  loadSprites() {
    // TODO: Should be just one sprite with left and right frames on there,
    // but I'm just going to do this for now
    const image = new Image();
    image.src = SANTA_SPRITE;
    this.playerSprite = new Sprite(image, { x: 8, y: 6 }, { x: 32, y: 32 }, 0, {
      x: this.x,
      y: this.y,
    });
    this.playerSprite.buildFrameMap();
    const imageLeft = new Image();
    imageLeft.src = SANTA_SPRITE_LEFT;
    this.playerSpriteLeft = new Sprite(
      imageLeft,
      { x: 8, y: 6 },
      { x: 32, y: 32 },
      0,
      { x: this.x, y: this.y }
    );
    this.playerSpriteLeft.buildFrameMap();
  }

  updatePlayerInterpolation(interpolationFactor: number, maxIntDist: number) {
    const startX = this.interpolation ? this.interpolation.x : this.x;
    const startY = this.interpolation ? this.interpolation.y : this.y;

    this.interpolation = {
      x:
        Math.abs(this.x - startX) > maxIntDist
          ? this.x
          : startX + interpolationFactor * (this.x - startX),
      y:
        Math.abs(this.y - startY) > maxIntDist
          ? this.y
          : startY + interpolationFactor * (this.y - startY),
    };
  }

  draw(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    isMe: boolean = false
  ) {
    // draw player
    const { x, y } = this.interpolation ?? this;
    const frameColorOffset =
      (SantaColorToSpriteRow.get(this.santaColor) ?? 0) * 8;
    // TODO: will be one sprite with left and right frames eventually
    if (this.isLeft) {
      this.playerSpriteLeft?.draw(
        ctx,
        x - cameraX,
        y - cameraY,
        frameColorOffset
      );
    } else {
      this.playerSprite?.draw(ctx, x - cameraX, y - cameraY, frameColorOffset);
    }
    // draw name
    let label = this.nickname;
    ctx.fillStyle = "#00ff00";
    if (isMe) {
      label = "You";
      ctx.fillStyle = "#ff0000";
    }
    ctx.font = "16px Arial";
    // The "10"s are just offsets to make the label look better imo
    ctx.fillText(
      label,
      x - cameraX - ctx.measureText(label).width / 2 + 10,
      y - cameraY - 10
    );
  }
}

type Snowball = {
  id: number;
  x: number;
  y: number;
};

const keyDirectionMap = new Map<string, MoveDirection>([
  ["KeyW", UP],
  ["KeyS", DOWN],
  ["KeyD", RIGHT],
  ["KeyA", LEFT],
]);

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
  onDeath,
  playerIdRef,
  setLatency,
}: {
  roomId: string;
  onScoresUpdated: (newScores: Score[]) => void;
  onGameOver: (winner: string) => void;
  onDisconnect: () => void;
  onTimeLeft: (timeLeft: number) => void;
  onDeath: (victimName: string, killerName: string) => void;
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
  }?roomId=${roomId}&nickname=${getNickname()}&santa=${getSantaColor()}`;

  const mapImage = new Image();
  mapImage.src = "/snowy-sheet.png";

  const crosshair = new Image();
  crosshair.src = "/crosshair.png";

  const crosshairArmed = new Image();
  crosshairArmed.src = "/crosshair-armed.png";

  const santaLeftImage = new Image();
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
      santaColor: player.santaColor,
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
    // Players can be the full list of players or just a delta
    serverPlayers.forEach((serverPlayer, idx) => {
      if (players && players[idx]) {
        players[idx].x = serverPlayer.x ?? players[idx].x;
        players[idx].y = serverPlayer.y ?? players[idx].y;
        players[idx].kills = serverPlayer.kills ?? players[idx].kills;
        players[idx].deaths = serverPlayer.deaths ?? players[idx].deaths;
        players[idx].canFire = serverPlayer.canFire ?? players[idx].canFire;
        players[idx].isLeft = serverPlayer.isLeft ?? players[idx].isLeft;
      } else {
        let player = new Player(
          serverPlayer.id,
          serverPlayer.x,
          serverPlayer.nickname,
          serverPlayer.santaColor,
          serverPlayer.y,
          serverPlayer.isLeft,
          serverPlayer.kills,
          serverPlayer.deaths,
          serverPlayer.canFire
        );
        players.push(player);
      }
    });
    if (isFirstPlayersEvent) {
      refreshScores();
    }
    isFirstPlayersEvent = false;
  });

  socket.on("snowballs", (serverSnowballs) => {
    snowballs = serverSnowballs;
  });

  socket.on("death", ({ victim, killer }) => {
    onDeath(victim.nickname, killer.nickname);
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

  let currentMoveDirection = NONE;
  window.addEventListener("keydown", (e) => {
    const direction = keyDirectionMap.get(e.code);
    if (direction) {
      currentMoveDirection |= direction;
      // walkSnow.play();
    }
    socket.emit("inputs", currentMoveDirection);
  });

  window.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
  });

  window.addEventListener("keyup", (e) => {
    const direction = keyDirectionMap.get(e.code);
    if (direction) {
      currentMoveDirection &= ~direction;
      walkSnow.pause();
      walkSnow.currentTime = 0;
    }
    socket.emit("inputs", currentMoveDirection);
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

    players.forEach((player) => {
      player.updatePlayerInterpolation(interpolationFactor, maxIntDist);
    });

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
      const { x, y } = myPlayer.interpolation ?? myPlayer;
      cameraX = Math.floor(x - canvasEl.width / 2);
      cameraY = Math.floor(y - canvasEl.height / 2);
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
      player.draw(canvas, cameraX, cameraY, getMyPlayer()?.id === player.id);
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
