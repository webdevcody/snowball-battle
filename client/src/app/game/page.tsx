"use client";

import { useEffect, useRef, useState } from "react";
import { start } from "./game";
import { useRouter, useSearchParams } from "next/navigation";
import { ScoreBoard } from "./scoreboard";
import { Button } from "@/components/ui/button";
import { UnplugIcon } from "lucide-react";
import Link from "next/link";
import { SantaColor } from "@/lib/player-options";

export type Score = {
  kills: number;
  deaths: number;
  player: string;
  nickname: string;
  santaColor: SantaColor;
};

export default function Game() {
  const params = useSearchParams();
  const [scores, setScores] = useState<Score[]>([]);
  const router = useRouter();
  const playerIdRef = useRef<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    const roomId = params.get("roomId");
    if (!roomId) return;

    const game = start({
      roomId,
      onScoresUpdated(newScores: Score[]) {
        setScores(newScores);
      },
      onGameOver(winner: string) {
        router.push(`/game-over?winner=${winner}`);
      },
      onDisconnect() {
        router.push(`/disconnect`);
      },
      onTimeLeft(newTimeLeft) {
        setTimeLeft(newTimeLeft);
      },
      setLatency,
      playerIdRef,
    });

    return () => {
      game.then(({ cleanup }) => {
        cleanup();
      });
    };
  }, [params]);

  return (
    <main className="relative">
      <canvas id="canvas" className="cursor-none"></canvas>
      <div className="absolute top-4 right-4 select-none">
        <ScoreBoard scores={scores} myPlayerId={playerIdRef.current} />
      </div>
      <div className="absolute top-4 left-4 flex gap-2">
        <Link href="/disconnect">
          <Button
            variant={"secondary"}
            className="flex gap-4 z-10 relative select-none"
          >
            <UnplugIcon /> Disconnect
          </Button>
        </Link>
        <div className="text-black bg-white border border-black rounded w-fit p-2 select-none">
          {latency} ms
        </div>
      </div>
      <div className="absolute top-4 flex justify-center w-full select-none">
        <div className="rounded-xl p-4 py-2 text-xs bg-gray-900 text-white">
          {Math.floor(timeLeft / 1000)} second remaining
        </div>
      </div>
    </main>
  );
}
