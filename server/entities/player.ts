import { MapManager } from "../map/map-manager";
import { Collidable } from "../traits/collidable";
import { NONE, UP, DOWN, LEFT, RIGHT } from "../../common/input";

export const PLAYER_SIZE = 32;

export class Player implements Collidable {
  public id: string;
  public x: number;
  public y: number;
  public isLeft: boolean;
  public kills: number;
  public nickname: string;
  public santaColor: string;
  public deaths: number;
  public canFire: boolean;
  public inputs: number;
  public isWalking: boolean = false;

  static SPEED = 0.2;

  constructor(id: string, nickname: string, santaColor: string) {
    this.id = id;
    this.x = 0;
    this.y = 0;
    this.isLeft = true;
    this.deaths = 0;
    this.kills = 0;
    this.nickname = nickname;
    this.santaColor = santaColor;
    this.canFire = true;
    this.inputs = NONE;
  }

  getHitbox() {
    return {
      w: 32,
      h: 32,
      x: this.x,
      y: this.y,
    };
  }

  update(
    context: {
      mapManager: MapManager;
    },
    delta: number
  ) {
    const previousY = this.y;
    const previousX = this.x;

    let playerSpeed = Player.SPEED;

    this.isWalking = false;
    if (
      this.inputs & UP ||
      this.inputs & DOWN ||
      this.inputs & LEFT ||
      this.inputs & RIGHT
    ) {
      this.isWalking = true;
    }

    if (
      (this.inputs & UP || this.inputs & DOWN) &&
      (this.inputs & LEFT || this.inputs & RIGHT)
    ) {
      playerSpeed = Player.SPEED * 0.7071067811865476;
    }

    if (this.inputs & UP) {
      this.y -= playerSpeed * delta;
    } else if (this.inputs & DOWN) {
      this.y += playerSpeed * delta;
    }

    if (context.mapManager.isCollidingWithMap(this)) {
      this.y = previousY;
    }

    if (this.inputs & LEFT) {
      this.x -= playerSpeed * delta;
      this.isLeft = true;
    } else if (this.inputs & RIGHT) {
      this.x += playerSpeed * delta;
      this.isLeft = false;
    }

    if (context.mapManager.isCollidingWithMap(this)) {
      this.x = previousX;
    }
  }

  setInputs(inputs: number) {
    this.inputs = inputs;
  }
}
