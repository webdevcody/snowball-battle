"use client";

import { useEffect, useState } from "react";
import {
  AuthV1Api,
  Lobby,
  LobbyV2Api,
  RoomV2Api,
} from "@hathora/hathora-cloud-sdk";
import { HATHORA_APP_ID } from "../config";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import CreatingGameLoader from "./creating-game-loader";

const roomClient = new RoomV2Api();
const authApi = new AuthV1Api();
const lobbyClient = new LobbyV2Api();

async function isReadyForConnect(
  appId: string,
  roomClient: RoomV2Api,
  roomId: string
) {
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

export default function Home() {
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [lobbyState, setLobbyState] = useState<"VIEW" | "CREATING">("VIEW");
  const router = useRouter();
  const [roomName, setRoomName] = useState("");

  useEffect(() => {
    (async () => {
      const lobbies = await lobbyClient.listActivePublicLobbies(HATHORA_APP_ID);
      console.log("lobbies", lobbies);
      setLobbies(lobbies);
    })();
  }, []);

  async function joinRoom(roomId: string) {
    const connectionInfo = await roomClient.getConnectionInfo(
      HATHORA_APP_ID,
      roomId
    );

    // TODO: I'd rather pass the room id now that I think about it
    router.push(
      `/game?websocketUrl=${encodeURI(
        `wss://${connectionInfo.exposedPort?.host}:${connectionInfo.exposedPort?.port}`
      )}`
    );
  }

  function getLobbyConfig(lobby: Lobby, key: string) {
    return lobby.initialConfig[key] as string;
  }

  async function createLobby() {
    setLobbyState("CREATING");
    const userInfo = await authApi.loginAnonymous(HATHORA_APP_ID);
    const lobby = await lobbyClient.createLobby(
      HATHORA_APP_ID,
      userInfo.token,
      {
        visibility: "public",
        region: "Washington_DC",
        initialConfig: {
          capacity: 8,
          winningScore: 5,
          roomName,
        },
      }
    );
    await isReadyForConnect(HATHORA_APP_ID, roomClient, lobby.roomId);
    joinRoom(lobby.roomId);
  }

  function GameCard({ lobby }: { lobby: Lobby }) {
    return (
      <div
        key={lobby.roomId}
        className="bg-white rounded-lg shadow-md p-4 text-gray-800"
      >
        <h2 className="text-xl font-semibold mb-2">
          {getLobbyConfig(lobby, "roomName")}
        </h2>
        <p className="text-gray-600 ">
          0 / {getLobbyConfig(lobby, "capacity")}
        </p>
        <button
          className="mt-4 inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            joinRoom(lobby.roomId);
          }}
        >
          Join Room
        </button>
      </div>
    );
  }

  return (
    <main className="">
      {lobbyState === "VIEW" && (
        <section className="w-full text-white h-screen bg-gray-900">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-center mb-8">
              Snowball Battle Lobby
            </h1>

            <div className="grid grid-cols-3 gap-4">
              {lobbies.map((lobby) => (
                <GameCard key={lobby.roomId} lobby={lobby} />
              ))}
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Create a New Room</h2>
              <form
                className="bg-white rounded-lg shadow-md p-4 "
                onSubmit={(e) => {
                  e.preventDefault();
                  createLobby();
                }}
              >
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="roomName"
                >
                  Room Name
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline "
                  id="roomName"
                  name="roomName"
                  placeholder="Enter room name"
                  type="text"
                  required
                  onChange={(e) => {
                    setRoomName(e.target.value);
                  }}
                />
                <Button
                  className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  type="submit"
                >
                  Create Room
                </Button>
              </form>
            </div>
          </div>
        </section>
      )}

      {lobbyState === "CREATING" && <CreatingGameLoader />}
    </main>
  );
}
