import { USE_LOCAL_WS } from "@/config";
import { ConnectionInfoV2 } from "@hathora/cloud-sdk-typescript/dist/sdk/models/shared";
import { hathoraClient } from "../lib/hathora";

export async function getConnectionInfo(
  roomId: string
): Promise<ConnectionInfoV2> {
  if (USE_LOCAL_WS) {
    return {
      exposedPort: {
        host: "localhost",
        port: 8000,
      },
    } as ConnectionInfoV2;
  } else {
    const response = await hathoraClient.roomV2.getConnectionInfo(roomId);
    const info = response.connectionInfoV2;
    if (!info) {
      throw new Error(`could not get the connection info for room ${roomId}`);
    }
    return info;
  }
}

export async function getRoomIdByShortCode(
  shortCode: string
): Promise<string | null> {
  try {
    const response = await hathoraClient.lobbyV3.getLobbyInfoByShortCode(
      shortCode
    );

    if (response.statusCode === 404) {
      return null;
    }

    if (response.lobbyV3?.roomId) {
      return response.lobbyV3.roomId;
    }
  } catch (e) {
    console.log("lobby not found");
  }

  return null;
}

export async function getShortCodeByRoomId(
  roomId: string
): Promise<string | null> {
  try {
    const response = await hathoraClient.lobbyV3.getLobbyInfoByRoomId(roomId);

    if (response.statusCode === 404) {
      return null;
    }

    if (response.lobbyV3) {
      return response.lobbyV3.shortCode;
    }
  } catch (e) {
    console.log("lobby not found");
  }

  return null;
}
