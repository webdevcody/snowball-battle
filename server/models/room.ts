import { Room, RoomV2Api } from "@hathora/hathora-cloud-sdk";
import { HATHORA_APP_ID, HATHORA_TOKEN, IS_LOCAL } from "../lib/config";

const roomClient = new RoomV2Api();

export async function getRoomInfo(roomId: string): Promise<Room> {
  if (IS_LOCAL) {
    return {
      roomConfig: JSON.stringify({
        capacity: 8,
        winningScore: 5,
      }),
    } as Room;
  } else {
    return roomClient.getRoomInfo(HATHORA_APP_ID, roomId, {
      headers: {
        Authorization: `Bearer ${HATHORA_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
  }
}

export async function destroyRoom(roomId: string) {
  if (IS_LOCAL) {
    return;
  } else {
    roomClient.destroyRoom(HATHORA_APP_ID, roomId, {
      headers: {
        Authorization: `Bearer ${HATHORA_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
  }
}
