"use client";

import { useEffect, useState } from "react";
import { start } from "./game";
import { useRouter, useSearchParams } from "next/navigation";
import { ScoreBoard } from "./scoreboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UnplugIcon } from "lucide-react";
import Link from "next/link";

export type Score = {
  kills: number;
  deaths: number;
  player: string;
};

export default function Game() {
  const params = useSearchParams();
  const [scores, setScores] = useState<Score[]>([]);
  const router = useRouter();

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
        <ScoreBoard scores={scores} />
      </div>
      <div className="absolute top-4 left-4">
        <Link href="/disconnect">
          <Button variant={"secondary"} className="flex gap-4">
            <UnplugIcon /> Disconnect
          </Button>
        </Link>
      </div>
    </main>
  );
}
