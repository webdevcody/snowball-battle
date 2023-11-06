import { LobbyV2Api } from "@hathora/hathora-cloud-sdk";
import { HATHORA_APP_ID, HATHORA_TOKEN } from "../lib/config";

const lobbyClient = new LobbyV2Api();

export async function updateLobbyState(
  roomId: string,
  newState: {
    numberOfPlayers: number;
  }
) {
  await lobbyClient.setLobbyState(
    HATHORA_APP_ID,
    roomId,
    {
      state: newState,
    },
    {
      headers: {
        Authorization: `Bearer ${HATHORA_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}
