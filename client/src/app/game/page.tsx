"use client";

import { useEffect, useRef, useState } from "react";
import { start } from "./game";
import { useRouter, useSearchParams } from "next/navigation";
import { ScoreBoard } from "./scoreboard";
import { Button } from "@/components/ui/button";
import { UnplugIcon } from "lucide-react";
import Link from "next/link";

export type Score = {
  kills: number;
  deaths: number;
  player: string;
  nickname: string;
};

export default function Game() {
  const params = useSearchParams();
  const [scores, setScores] = useState<Score[]>([]);
  const router = useRouter();
  const playerIdRef = useRef<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);

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
      <canvas id="canvas"></canvas>
      <div className="absolute top-4 right-4">
        <ScoreBoard scores={scores} myPlayerId={playerIdRef.current} />
      </div>
      <div className="absolute top-4 left-4">
        <Link href="/disconnect">
          <Button variant={"secondary"} className="flex gap-4">
            <UnplugIcon /> Disconnect
          </Button>
        </Link>
      </div>
      <div className="absolute top-4 flex justify-center w-full">
        <div className="rounded-xl p-4 py-2 text-xs bg-gray-900 text-white">
          {Math.floor(timeLeft / 1000)} second remaining
        </div>
      </div>
    </main>
  );
}
