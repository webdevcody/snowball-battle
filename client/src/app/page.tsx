"use client";

import { useEffect, useState } from "react";
import { Lobby, LobbyV2Api } from "@hathora/hathora-cloud-sdk";
import { HATHORA_APP_ID } from "../config";
import { useRouter } from "next/navigation";
import CreatingGameLoader from "./creating-game-loader";
import { CreateRoomSection } from "./create-room-section";

const lobbyClient = new LobbyV2Api();

export default function Home() {
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [lobbyState, setLobbyState] = useState<"VIEW" | "CREATING">("VIEW");
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const lobbies = await lobbyClient.listActivePublicLobbies(HATHORA_APP_ID);
      setLobbies(lobbies);
    })();
  }, []);

  async function joinRoom(roomId: string) {
    router.push(`/game?roomId=${roomId}`);
  }

  function getLobbyConfig(lobby: Lobby, key: string) {
    return lobby.initialConfig[key] as string;
  }

  function getLobbyState(lobby: Lobby, key: string): string | undefined {
    return (lobby.state as any)?.[key];
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
          {getLobbyState(lobby, "numberOfPlayers") ?? 0} /{" "}
          {getLobbyConfig(lobby, "capacity")}
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

            <div className="grid grid-cols-4 gap-12">
              <div className="col-span-3">
                <h2 className="text-2xl font-semibold mb-4 text-white">
                  Current Games
                </h2>

                <div className="bg-gray-700 rounded-lg shadow-md p-4">
                  {lobbies.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4">
                      {lobbies.map((lobby) => (
                        <GameCard key={lobby.roomId} lobby={lobby} />
                      ))}
                    </div>
                  ) : (
                    <div>There are no active games</div>
                  )}
                </div>
              </div>

              <div className="col-span-1">
                <h2 className="text-2xl font-semibold mb-4 text-white">
                  Create a New Room
                </h2>

                <div
                  className="bg-gray-700 rounded-lg shadow-md p-4 flex flex-col
                gap-8"
                >
                  <CreateRoomSection
                    onRoomCreated={() => {
                      setLobbyState("CREATING");
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {lobbyState === "CREATING" && <CreatingGameLoader />}
    </main>
  );
}
