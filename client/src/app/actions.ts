"use server";

import { RoomV2Api } from "@hathora/hathora-cloud-sdk";

export async function createRoom() {
  const developerToken = process.env.HATHORA_TOKEN as string;
  const appId = process.env.HATHORA_APP_ID as string;
  const roomId = undefined;

  const roomClient = new RoomV2Api();

  const room = await roomClient.createRoom(
    appId,
    {
      region: "Seattle",
    },
    roomId,
    {
      headers: {
        Authorization: `Bearer ${developerToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  return room;
}
