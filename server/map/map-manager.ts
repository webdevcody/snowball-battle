import { Player } from "../entities/player";
import { loadMap } from "../mapLoader";
import { Collidable } from "../traits/collidable";
import { Rect, isColliding } from "../utils/geom";

export const TILE_SIZE = 32;

// TODO: don't hard code spawn points
const SPAWN_POINTS = [
  {
    x: 813,
    y: 739,
  },
  {
    x: 1161,
    y: 1156,
  },
  {
    x: 1161,
    y: 1891,
  },
  {
    x: 1572,
    y: 2188,
  },
  {
    x: 2313,
    y: 2188,
  },
  {
    x: 2397,
    y: 1555,
  },
  {
    x: 2190,
    y: 859,
  },
  {
    x: 1773,
    y: 1471,
  },
];

export function getRandomSpawn() {
  return SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
}

type Tile = {
  id: any;
  gid: any;
};

export class MapManager {
  public ground: Tile[][];
  public decals: (Tile | undefined)[][];

  constructor(ground: Tile[][], decals: (Tile | undefined)[][]) {
    this.ground = ground;
    this.decals = decals;
  }

  static async create() {
    const mapData = await loadMap();
    const mapManager = new MapManager(mapData.ground2D, mapData.decal2D);
    return mapManager;
  }

  isCollidingWithMap(rect: Collidable) {
    for (let row = 0; row < this.decals.length; row++) {
      for (let col = 0; col < this.decals[0].length; col++) {
        const tile = this.decals[row][col];

        if (
          tile &&
          isColliding(rect.getHitbox(), {
            x: col * TILE_SIZE + 10,
            y: row * TILE_SIZE + 10,
            w: TILE_SIZE - 14,
            h: TILE_SIZE - 14,
          })
        ) {
          return true;
        }
      }
    }
    return false;
  }

  isCollidingWithTree(rect: Collidable) {
    const treeIds = [34, 35, 36, 37, 42, 43, 44, 45, 50, 51, 52, 53];
    for (let row = 0; row < this.decals.length; row++) {
      for (let col = 0; col < this.decals[0].length; col++) {
        const tile = this.decals[row][col];
        if (
          tile &&
          treeIds.includes(tile.id) &&
          isColliding(rect.getHitbox(), {
            x: col * TILE_SIZE + 10,
            y: row * TILE_SIZE + 10,
            w: TILE_SIZE - 14,
            h: TILE_SIZE - 14,
          })
        ) {
          return true;
        }
      }
    }
    return false;
  }
}
