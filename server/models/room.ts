import { Room, RoomV2Api } from "@hathora/hathora-cloud-sdk";
import { HATHORA_APP_ID, IS_LOCAL } from "../lib/config";

const roomClient = new RoomV2Api();

export async function getRoomInfo(roomId: string): Promise<Room> {
  if (IS_LOCAL) {
    return {
      roomConfig: JSON.stringify({
        capacity: 8,
      }),
    } as Room;
  } else {
    return roomClient.getRoomInfo(HATHORA_APP_ID, roomId);
  }
}
