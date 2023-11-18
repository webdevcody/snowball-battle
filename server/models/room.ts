import {
  Room,
  UpdateRoomConfigParams,
} from "@hathora/cloud-sdk-typescript/dist/sdk/models/shared";
import { IS_LOCAL } from "../lib/config";
import { hathoraSdk } from "../lib/hathora";

export async function updateRoomConfig(
  config: UpdateRoomConfigParams,
  roomId: string
) {
  if (IS_LOCAL) {
    return {
      roomConfig: JSON.stringify({
        capacity: 8,
        winningScore: 5,
      }),
    } as Room;
  } else {
    const response = await hathoraSdk.roomV2.updateRoomConfig(config, roomId);

    if (response.statusCode !== 200) {
      throw new Error(`could not update the room config for room ${roomId}`);
    }
  }
}

export async function getRoomInfo(roomId: string): Promise<Room> {
  if (IS_LOCAL) {
    return {
      roomConfig: JSON.stringify({
        capacity: 8,
        winningScore: 5,
      }),
    } as Room;
  } else {
    const response = await hathoraSdk.roomV2.getRoomInfo(roomId);
    const room = response.room;
    if (!room) {
      throw new Error(`room of ${roomId} not found`);
    }
    return room;
  }
}

export async function destroyRoom(roomId: string) {
  if (IS_LOCAL) {
    return;
  } else {
    await hathoraSdk.roomV2.destroyRoom(roomId);
  }
}
