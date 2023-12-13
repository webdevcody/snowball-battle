import { loadMap } from "./map-loader";
import { Collidable } from "../traits/collidable";
import { isColliding } from "../utils/geom";
import { MAP_OPTIONS, MapKey } from "../../common/map-options";
import { TileType } from "../../common/map-types";

export const TILE_SIZE = 32;

export class MapManager {
  public ground: TileType[][];
  public decals: (TileType | undefined)[][];
  public validSpawnPoints: { x: number; y: number }[];

  constructor(
    ground: TileType[][],
    decals: (TileType | undefined)[][],
    spawnPoints: { x: number; y: number }[]
  ) {
    this.ground = ground;
    this.decals = decals;
    this.validSpawnPoints = spawnPoints;
  }

  static async create(mapKey: MapKey) {
    const mapOption = MAP_OPTIONS.get(mapKey);
    if (!mapOption) {
      throw new Error(`Map ${mapKey} does not exist`);
    }
    const mapData = await loadMap(mapOption.fileName);
    const mapManager = new MapManager(
      mapData.ground2D,
      mapData.decal2D,
      mapOption.validSpawnPoints
    );
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

  getRandomSpawn() {
    return this.validSpawnPoints[
      Math.floor(Math.random() * this.validSpawnPoints.length)
    ];
  }
}
