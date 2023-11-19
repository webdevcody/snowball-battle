import { Rect } from "../utils/geom";

export interface Collidable {
  getHitbox(): Rect;
}
