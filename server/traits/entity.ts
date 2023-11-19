import { MapManager } from "../map/map-manager";

export interface Entity {
  x: number;
  y: number;
  update(context: { mapManager: MapManager }, delta: number): void;
}
