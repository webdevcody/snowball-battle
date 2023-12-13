import { MapKey } from "./map-options";

export type RoomConfig = {
  winningScore: number;
  capacity: number;
  mapOption: MapKey; 
  roomName: string;
  numberOfPlayers: number;
}