import { LobbyV2Api } from "@hathora/hathora-cloud-sdk";
import { HATHORA_APP_ID, HATHORA_TOKEN, IS_LOCAL } from "../lib/config";

const lobbyClient = new LobbyV2Api();

export function updateLobbyState(
  roomId: string,
  newState: {
    numberOfPlayers: number;
  }
) {
  if (IS_LOCAL) {
    return;
  } else {
    lobbyClient.setLobbyState(
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
}
