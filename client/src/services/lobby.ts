import { USE_LOCAL_WS, WINNING_SCORE } from "@/config";
import { hathoraClient } from "@/lib/hathora";
import {
  LobbyV3,
  LobbyVisibility,
  Region,
} from "@hathora/cloud-sdk-typescript/dist/sdk/models/shared";
import { getConnectionInfo, getShortCodeByRoomId } from "./room";
import { RoomConfig } from "@common/room-info";
import { MapKey } from "@common/map-options";
import { generateShortCode } from "@/lib/utils";

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
  mapOption,
  idToken,
}: {
  roomName: string;
  region: RegionValues;
  capacity: number;
  mapOption: MapKey;
  idToken: string;
}): Promise<LobbyV3> {
  const loginResponse = await hathoraClient.authV1.loginGoogle({
    idToken,
  });
  const loginInfo = loginResponse.loginResponse;

  if (!loginInfo) {
    throw new Error(`could not log in to hathora`);
  }

  const roomConfig: RoomConfig = {
    winningScore: WINNING_SCORE,
    capacity: capacity,
    mapOption: mapOption,
    roomName: roomName,
    numberOfPlayers: 0,
  };

  const shortCode = generateShortCode();
  const response = await hathoraClient.lobbyV3.createLobby(
    {
      createLobbyV3Params: {
        visibility: (USE_LOCAL_WS ? "local" : "public") as LobbyVisibility,
        region: region as Region,
        roomConfig: JSON.stringify(roomConfig),
      },
      shortCode: shortCode,
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
