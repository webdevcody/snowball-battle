import { MapManager, getRandomSpawn } from "../map/map-manager";
import { Collidable } from "../traits/collidable";
import { Entity } from "../traits/entity";
import { Inputs, PLAYER_SIZE, Player } from "./player";

export const SNOWBALL_SPEED = 0.6;

export class Snowball implements Collidable, Entity {
  public id: number;
  public x: number;
  public y: number;
  public angle: number;
  public playerId: string;
  public timeLeft: number;

  static SPEED = 0.2;
  static TTL = 1000;

  constructor(x: number, y: number, angle: number, playerId: string) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.playerId = playerId;
    this.timeLeft = 1000;
    this.id = Math.random();
  }

  getHitbox() {
    return {
      w: 10,
      h: 10,
      x: this.x,
      y: this.y,
    };
  }

  update(
    context: {
      mapManager: MapManager;
      broadcast: (event: string, payload: any) => void;
      getPlayers: () => Player[];
      getPlayer: (playerId: string) => Player | undefined;
      declareWinner: (nickname: string) => void;
      getWinningScore: () => number;
      onKill: (victim: Player, killer: Player) => void;
    },
    delta: number
  ) {
    this.x += Math.cos(this.angle) * SNOWBALL_SPEED * delta;
    this.y += Math.sin(this.angle) * SNOWBALL_SPEED * delta;
    this.timeLeft -= delta;

    if (context.mapManager.isCollidingWithTree(this)) {
      this.timeLeft = -1;
    }

    for (const player of context.getPlayers()) {
      if (player.id === this.playerId) continue;
      const distance = Math.sqrt(
        (player.x + PLAYER_SIZE / 2 - this.x) ** 2 +
          (player.y + PLAYER_SIZE / 2 - this.y) ** 2
      );
      if (distance <= PLAYER_SIZE) {
        const spawn = getRandomSpawn();
        player.x = spawn.x;
        player.y = spawn.y;
        this.timeLeft = -1;
        player.deaths++;
        const ownerOfSnowball = context.getPlayer(this.playerId);
        if (ownerOfSnowball) {
          ownerOfSnowball.kills++;

          if (ownerOfSnowball.kills >= context.getWinningScore()) {
            context.declareWinner(ownerOfSnowball.nickname);
          }

          context.onKill(player, ownerOfSnowball);
        }

        break;
      }
    }
  }
}
