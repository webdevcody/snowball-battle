import { USE_LOCAL_WS, WINNING_SCORE } from "@/config";
import { hathoraClient } from "@/lib/hathora";
import {
  LobbyV3,
  LobbyVisibility,
  Region,
} from "@hathora/cloud-sdk-typescript/dist/sdk/models/shared";
import { getConnectionInfo } from "./room";

export const REGIONS = Object.values(Region);
export type RegionValues = `${Region}`;

async function isReadyForConnect(roomId: string) {
  if (USE_LOCAL_WS) return;
  const MAX_CONNECT_ATTEMPTS = 50;
  const TRY_CONNECT_INTERVAL_MS = 1000;

  for (let i = 0; i < MAX_CONNECT_ATTEMPTS; i++) {
    const connetionInfo = await getConnectionInfo(roomId);
    if (connetionInfo.status === "active") {
      return;
    }
    await new Promise((resolve) =>
      setTimeout(resolve, TRY_CONNECT_INTERVAL_MS)
    );
  }
  throw new Error("Polling timed out");
}

export async function createLobby({
  roomName,
  region,
  capacity,
}: {
  roomName: string;
  region: RegionValues;
  capacity: number;
}): Promise<LobbyV3> {
  const loginResponse = await hathoraClient.authV1.loginAnonymous();
  const loginInfo = loginResponse.loginResponse;
  if (!loginInfo) {
    throw new Error(`could not log in to hathora`);
  }

  const response = await hathoraClient.lobbyV3.createLobby(
    {
      createLobbyV3Params: {
        visibility: (USE_LOCAL_WS ? "local" : "public") as LobbyVisibility,
        region: region as Region,
        roomConfig: JSON.stringify({
          capacity,
          winningScore: WINNING_SCORE,
          roomName,
          numberOfPlayers: 0,
        }),
      },
    },
    {
      playerAuth: loginInfo.token,
    }
  );

  const lobbyInfo = response.lobbyV3;
  if (!lobbyInfo) {
    throw new Error(`could not create a lobby`);
  }
  await isReadyForConnect(lobbyInfo.roomId);
  return lobbyInfo;
}

export async function listActivePublicLobbies() {
  const response = await hathoraClient.lobbyV3.listActivePublicLobbies();
  return response.classes ?? [];
}
