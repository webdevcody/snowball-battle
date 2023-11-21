import {
  Room,
  UpdateRoomConfigParams,
} from "@hathora/cloud-sdk-typescript/dist/sdk/models/shared";
import { hathoraSdk } from "../lib/hathora";

export async function updateRoomConfig(
  config: UpdateRoomConfigParams,
  roomId: string
) {
  const response = await hathoraSdk.roomV2.updateRoomConfig(config, roomId);

  if (response.statusCode !== 200) {
    throw new Error(`could not update the room config for room ${roomId}`);
  }
}

export async function getRoomInfo(roomId: string): Promise<Room> {
  const response = await hathoraSdk.roomV2.getRoomInfo(roomId);
  const room = response.room;
  if (!room) {
    throw new Error(`room of ${roomId} not found`);
  }
  return room;
}

export async function destroyRoom(roomId: string) {
  await hathoraSdk.roomV2.destroyRoom(roomId);
}
