import io from "socket.io-client";

export function start() {
  const mapImage = new Image();
  mapImage.src = "/snowy-sheet.png";

  const santaImage = new Image();
  santaImage.src = "/santa.png";

  const walkSnow = new Audio("walk-snow.mp3");

  const canvasEl = document.getElementById("canvas");
  canvasEl.width = window.innerWidth;
  canvasEl.height = window.innerHeight;
  const canvas = canvasEl.getContext("2d");

  const socket = io("ws://localhost:5000");

  let isPlaying = true;

  const remoteUsers = {};
  window.remoteUsers = remoteUsers;

  let groundMap = [[]];
  let decalMap = [[]];
  let players = [];
  let snowballs = [];

  const TILE_SIZE = 32;
  const SNOWBALL_RADIUS = 5;

  socket.on("connect", () => {
    console.log("connected");
  });

  socket.on("map", (loadedMap) => {
    groundMap = loadedMap.ground;
    decalMap = loadedMap.decal;
  });

  socket.on("players", (serverPlayers) => {
    players = serverPlayers;
  });

  socket.on("snowballs", (serverSnowballs) => {
    snowballs = serverSnowballs;
  });

  const inputs = {
    up: false,
    down: false,
    left: false,
    right: false,
  };

  window.addEventListener("keydown", (e) => {
    if (e.key === "w") {
      inputs["up"] = true;
    } else if (e.key === "s") {
      inputs["down"] = true;
    } else if (e.key === "d") {
      inputs["right"] = true;
    } else if (e.key === "a") {
      inputs["left"] = true;
    }
    if (["a", "s", "w", "d"].includes(e.key) && walkSnow.paused) {
      // walkSnow.play();
    }
    socket.emit("inputs", inputs);
  });

  window.addEventListener("keyup", (e) => {
    if (e.key === "w") {
      inputs["up"] = false;
    } else if (e.key === "s") {
      inputs["down"] = false;
    } else if (e.key === "d") {
      inputs["right"] = false;
    } else if (e.key === "a") {
      inputs["left"] = false;
    }
    if (["a", "s", "w", "d"].includes(e.key)) {
      walkSnow.pause();
      walkSnow.currentTime = 0;
    }
    socket.emit("inputs", inputs);
  });

  window.addEventListener("click", (e) => {
    const angle = Math.atan2(
      e.clientY - canvasEl.height / 2,
      e.clientX - canvasEl.width / 2
    );
    socket.emit("snowball", angle);
  });

  function loop() {
    canvas.clearRect(0, 0, canvasEl.width, canvasEl.height);

    const myPlayer = players.find((player) => player.id === socket.id);
    let cameraX = 0;
    let cameraY = 0;
    if (myPlayer) {
      cameraX = parseInt(myPlayer.x - canvasEl.width / 2);
      cameraY = parseInt(myPlayer.y - canvasEl.height / 2);
    }

    const TILES_IN_ROW = 8;

    // ground
    for (let row = 0; row < groundMap.length; row++) {
      for (let col = 0; col < groundMap[0].length; col++) {
        let { id } = groundMap[row][col];
        const imageRow = parseInt(id / TILES_IN_ROW);
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
        const imageRow = parseInt(id / TILES_IN_ROW);
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
      canvas.drawImage(santaImage, player.x - cameraX, player.y - cameraY);
    }

    for (const snowball of snowballs) {
      canvas.fillStyle = "#FFFFFF";
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

    window.requestAnimationFrame(loop);
  }

  window.requestAnimationFrame(loop);
}
