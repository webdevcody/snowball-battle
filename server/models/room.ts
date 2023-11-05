import { RoomV2Api } from "@hathora/hathora-cloud-sdk";
import { HATHORA_APP_ID } from "../lib/config";

const roomClient = new RoomV2Api();

export function getRoomInfo(roomId: string) {
  return roomClient.getRoomInfo(HATHORA_APP_ID, roomId);
}
