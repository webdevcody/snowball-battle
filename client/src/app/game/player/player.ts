import { SantaColor } from "@/lib/player-options";
import {
  idleAnimation,
  idleAnimationLeft,
  walkAnimation,
  walkAnimationLeft,
} from "../animation/santaAnimation";
import { FrameIndexPattern } from "../animation/frameindex";

const SANTA_SPRITE = "/santa-sprite.png";
const SANTA_SPRITE_LEFT = "/santa-sprite-left.png";
const SANTA_SPRITE_SHEET_DIMS = { x: 8, y: 6 };
const SANTA_SPRITE_FRAME_DIMS = { x: 32, y: 32 };

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

  ij_to_flat_index(row: number, col: number) {
    return row * this.spriteDims.x + col;
  }

  buildFrameMap() {
    for (let c = 0; c < this.spriteDims.x; c++) {
      for (let r = 0; r < this.spriteDims.y; r++) {
        this.frameMap.set(this.ij_to_flat_index(r, c), {
          x: c * this.frameDims.x,
          y: r * this.frameDims.y,
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

export default class Player {
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
  idleAnimation: FrameIndexPattern;
  idleAnimationLeft: FrameIndexPattern;
  walkAnimation: FrameIndexPattern;
  walkAnimationLeft: FrameIndexPattern;

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

    // animations - can be dry'd / refactored
    const colorOffset = (SantaColorToSpriteRow.get(this.santaColor) ?? 0) * 8;
    this.idleAnimation = new FrameIndexPattern(idleAnimation(colorOffset));
    this.walkAnimation = new FrameIndexPattern(walkAnimation(colorOffset));
    // TODO
    this.idleAnimationLeft = new FrameIndexPattern(
      idleAnimationLeft(colorOffset)
    );
    this.walkAnimationLeft = new FrameIndexPattern(
      walkAnimationLeft(colorOffset)
    );
    console.log(colorOffset);
  }

  loadSprites() {
    // TODO: Should be just one sprite with left and right frames on there,
    // but I'm just going to do this for now
    const image = new Image();
    image.src = SANTA_SPRITE;
    this.playerSprite = new Sprite(
      image,
      SANTA_SPRITE_SHEET_DIMS,
      SANTA_SPRITE_FRAME_DIMS,
      0,
      {
        x: this.x,
        y: this.y,
      }
    );
    const imageLeft = new Image();
    imageLeft.src = SANTA_SPRITE_LEFT;
    this.playerSpriteLeft = new Sprite(
      imageLeft,
      SANTA_SPRITE_SHEET_DIMS,
      SANTA_SPRITE_FRAME_DIMS,
      0,
      { x: this.x, y: this.y }
    );
    this.playerSprite.buildFrameMap();
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

  updateAnimations(deltaTime: number) {
    if (this.isWalking) {
      this.walkAnimation.update(deltaTime);
      this.walkAnimationLeft.update(deltaTime);
    } else {
      this.idleAnimation.update(deltaTime);
      this.idleAnimationLeft.update(deltaTime);
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    deltaTime: number,
    isMe: boolean = false
  ) {
    this.updateAnimations(deltaTime);

    // draw player
    const { x, y } = this.interpolation ?? this;

    // TODO: will be one sprite with left and right frames eventually
    if (this.isLeft) {
      const frame = this.isWalking
        ? this.walkAnimationLeft.getFrame()
        : this.idleAnimationLeft.getFrame();
      this.playerSpriteLeft?.draw(ctx, x - cameraX, y - cameraY, frame);
    } else {
      const frame = this.isWalking
        ? this.walkAnimation.getFrame()
        : this.idleAnimation.getFrame();
      this.playerSprite?.draw(ctx, x - cameraX, y - cameraY, frame);
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
