"use client";

import { useEffect, useState } from "react";
import { Lobby, LobbyV2Api } from "@hathora/hathora-cloud-sdk";
import { HATHORA_APP_ID } from "../config";
import { useRouter } from "next/navigation";
import { formatDistance } from "date-fns";
import CreatingGameLoader from "./creating-game-loader";
import { CreateRoomSection } from "./create-room-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const lobbyClient = new LobbyV2Api();

export default function Home() {
  const [lobbies, setLobbies] = useState<Lobby[]>([
    // {
    //   roomId: "a",
    //   createdAt: new Date(),
    //   initialConfig: {
    //     capacity: 8,
    //     roomName: "some name",
    //   },
    //   state: {
    //     numberOfPlayers: 5,
    //   },
    // },
  ]);
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
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle> {getLobbyConfig(lobby, "roomName")}</CardTitle>
          <CardDescription>
            Slots {getLobbyState(lobby, "numberOfPlayers") ?? 0} /{" "}
            {getLobbyConfig(lobby, "capacity")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          Created{" "}
          {formatDistance(lobby.createdAt, new Date(), { addSuffix: true })}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            onClick={() => {
              joinRoom(lobby.roomId);
            }}
          >
            Join Room
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <main className="">
      {lobbyState === "VIEW" && (
        <section className="w-full text-white h-screen">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-center mb-8">
              Snowball Battle Lobby
            </h1>

            <div className="grid grid-cols-4 gap-12">
              <div className="col-span-3">
                <h2 className="text-2xl font-semibold mb-4 text-white">
                  Current Games
                </h2>

                <div className="rounded-lg shadow-md">
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
