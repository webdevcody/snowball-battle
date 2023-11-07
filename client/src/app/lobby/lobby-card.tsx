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
import clsx from "clsx";
import { formatDistance } from "date-fns";
import { RabbitIcon, SnailIcon, TurtleIcon } from "lucide-react";
import { useRouter } from "next/navigation";

function getLobbyConfig(lobby: Lobby, key: string) {
  return lobby.initialConfig[key] as string;
}

function getLobbyState(lobby: Lobby, key: string): string | undefined {
  return (lobby.state as any)?.[key];
}

function LatencyIcon({ latency }: { latency: number }) {
  let speed: "FAST" | "OK" | "SLOW";

  if (latency <= 100) {
    speed = "FAST";
  } else if (latency <= 200) {
    speed = "OK";
  } else {
    speed = "SLOW";
  }
  const icon = {
    FAST: <RabbitIcon />,
    OK: <TurtleIcon />,
    SLOW: <SnailIcon />,
  }[speed];

  return latency === 0 ? (
    <div className="flex gap-2 items-center">
      <div className="animate-spin w-4 h-4 border-t-2 border-b-2 border-white rounded-full" />{" "}
      <div>? ms</div>
    </div>
  ) : (
    <div
      className={clsx("flex gap-2 items-center", {
        "text-green-400": speed === "FAST",
        "text-yellow-400": speed === "OK",
        "text-red-400": speed === "SLOW",
      })}
    >
      {icon} {latency} ms
    </div>
  );
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
