"use client";

import { useEffect, useState } from "react";
import { start } from "./game";
import { createRoom } from "./actions";
import { ConnectionDetails } from "@hathora/client-sdk";
import {
  AuthV1Api,
  Lobby,
  LobbyV2Api,
  RoomV2Api,
} from "@hathora/hathora-cloud-sdk";
import { HATHORA_APP_ID } from "../config";

const lobbyClient = new LobbyV2Api();

export async function isReadyForConnect(
  appId: string,
  roomClient: RoomV2Api,
  roomId: string
) {
  const MAX_CONNECT_ATTEMPTS = 50;
  const TRY_CONNECT_INTERVAL_MS = 1000;

  for (let i = 0; i < MAX_CONNECT_ATTEMPTS; i++) {
    const connetionInfo = await roomClient.getConnectionInfo(appId, roomId);
    if (connetionInfo.status === "active") {
      return connetionInfo;
    }
    await new Promise((resolve) =>
      setTimeout(resolve, TRY_CONNECT_INTERVAL_MS)
    );
  }
  throw new Error("Polling timed out");
}

export default function Home() {
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [lobbyState, setLobbyState] = useState<"WAITING" | "PLAYING">(
    "WAITING"
  );

  useEffect(() => {
    (async () => {
      const lobbies = await lobbyClient.listActivePublicLobbies(HATHORA_APP_ID);
      setLobbies(lobbies);
    })();
  }, []);

  return (
    <main className="">
      <button
        onClick={async () => {
          const lobbyClient = new LobbyV2Api();
          const roomClient = new RoomV2Api();

          const authApi = new AuthV1Api();
          const userInfo = await authApi.loginAnonymous(HATHORA_APP_ID);

          console.log("logged in", userInfo.token);
          const lobby = await lobbyClient.createLobby(
            HATHORA_APP_ID,
            userInfo.token,
            {
              visibility: "public",
              region: "Washington_DC",
              initialConfig: {
                capacity: 8,
                winningScore: 5,
              },
            }
          );

          console.log("creating lobby");

          const connectionInfo = await isReadyForConnect(
            HATHORA_APP_ID,
            roomClient,
            lobby.roomId
          );

          console.log("room is ready to connect");
          console.log(connectionInfo);
          start({
            websocketUrl: `${connectionInfo.exposedPort?.host}:${connectionInfo.exposedPort?.port}`,
          });
        }}
      >
        Join Game
      </button>
      {lobbies.map((lobby) => {
        return <div key={lobby.roomId}>region: {lobby.region}</div>;
      })}
      <canvas id="canvas"></canvas>
    </main>
  );
}
