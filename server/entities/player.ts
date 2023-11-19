import { MapManager } from "../map/map-manager";
import { Collidable } from "../traits/collidable";
import { Rect } from "../utils/geom";

export const PLAYER_SIZE = 32;

export type Inputs = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

export class Player implements Collidable {
  public id: string;
  public x: number;
  public y: number;
  public isLeft: boolean;
  public kills: number;
  public nickname: string;
  public deaths: number;
  public canFire: boolean;

  static SPEED = 0.2;

  public inputs: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  };

  constructor(id: string, nickname: string) {
    this.id = id;
    this.x = 0;
    this.y = 0;
    this.isLeft = true;
    this.deaths = 0;
    this.kills = 0;
    this.nickname = nickname;
    this.canFire = true;

    this.inputs = {
      up: false,
      down: false,
      left: false,
      right: false,
    };
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

    if (
      (this.inputs.up || this.inputs.down) &&
      (this.inputs.left || this.inputs.right)
    ) {
      playerSpeed = Player.SPEED * 0.7071067811865476;
    }

    if (this.inputs.up) {
      this.y -= playerSpeed * delta;
    } else if (this.inputs.down) {
      this.y += playerSpeed * delta;
    }

    if (context.mapManager.isCollidingWithMap(this)) {
      this.y = previousY;
    }

    if (this.inputs.left) {
      this.x -= playerSpeed * delta;
      this.isLeft = true;
    } else if (this.inputs.right) {
      this.x += playerSpeed * delta;
      this.isLeft = false;
    }

    if (context.mapManager.isCollidingWithMap(this)) {
      this.x = previousX;
    }
  }

  setInputs(inputs: Inputs) {
    this.inputs = inputs;
  }
}
