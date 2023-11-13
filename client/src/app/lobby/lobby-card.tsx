import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { formatDistance } from "date-fns";
import { useRouter } from "next/navigation";
import { LatencyIcon } from "./latency-icon";
import { LobbyV3 } from "@hathora/cloud-sdk-typescript/dist/sdk/models/shared";

export function GameCard({
  latency,
  lobby,
}: {
  latency: number;
  lobby: LobbyV3;
}) {
  const router = useRouter();

  const config = JSON.parse(lobby.roomConfig) as {
    roomName: string;
    numberOfPlayers: number;
    capacity: number;
  };

  return (
    <Card className="bg-gray-700">
      <CardHeader>
        <CardTitle> {config.roomName}</CardTitle>
        <CardDescription className="flex flex-col gap-2">
          <div className="text-lg">
            Slots {config.numberOfPlayers} /{config.capacity}
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
