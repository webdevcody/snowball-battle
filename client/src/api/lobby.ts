import { HATHORA_APP_ID, USE_LOCAL_WS, WINNING_SCORE } from "@/config";
import {
  AuthV1Api,
  Lobby,
  LobbyV2Api,
  Region,
  RoomV2Api,
} from "@hathora/hathora-cloud-sdk";

const roomClient = new RoomV2Api();
const authApi = new AuthV1Api();
const lobbyClient = new LobbyV2Api();

export const REGIONS = [""];

async function isReadyForConnect(
  appId: string,
  roomClient: RoomV2Api,
  roomId: string
) {
  if (USE_LOCAL_WS) return;
  const MAX_CONNECT_ATTEMPTS = 50;
  const TRY_CONNECT_INTERVAL_MS = 1000;

  for (let i = 0; i < MAX_CONNECT_ATTEMPTS; i++) {
    const connetionInfo = await roomClient.getConnectionInfo(appId, roomId);
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
  region: Region;
  capacity: number;
}): Promise<Lobby> {
  const userInfo = await authApi.loginAnonymous(HATHORA_APP_ID);
  const lobby = await lobbyClient.createLobby(HATHORA_APP_ID, userInfo.token, {
    visibility: USE_LOCAL_WS ? "local" : "public",
    region,
    initialConfig: {
      capacity,
      winningScore: WINNING_SCORE,
      roomName,
    },
  });
  await isReadyForConnect(HATHORA_APP_ID, roomClient, lobby.roomId);
  return lobby;
}
