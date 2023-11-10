import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Lobby } from "@hathora/hathora-cloud-sdk";
import { formatDistance } from "date-fns";
import { useRouter } from "next/navigation";
import { LatencyIcon } from "./latency-icon";

function getLobbyConfig(lobby: Lobby, key: string) {
  return lobby.initialConfig[key] as string;
}

function getLobbyState(lobby: Lobby, key: string): string | undefined {
  return (lobby.state as any)?.[key];
}

export function GameCard({
  latency,
  lobby,
}: {
  latency: number;
  lobby: Lobby;
}) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle> {getLobbyConfig(lobby, "roomName")}</CardTitle>
        <CardDescription className="flex flex-col gap-2">
          <div className="text-lg">
            Slots {getLobbyState(lobby, "numberOfPlayers") ?? 0} /
            {getLobbyConfig(lobby, "capacity")}
          </div>
          <div>{lobby.region}</div>
          <div>
            <LatencyIcon latency={latency} />
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        Created{" "}
        {formatDistance(lobby.createdAt, new Date(), { addSuffix: true })}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          onClick={() => {
            router.push(`/game?roomId=${lobby.roomId}`);
          }}
        >
          Join Room
        </Button>
      </CardFooter>
    </Card>
  );
}
