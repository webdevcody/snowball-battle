"use client";

import { useEffect, useState } from "react";
import { start } from "./game";
import { useRouter, useSearchParams } from "next/navigation";
import { ScoreBoard } from "./scoreboard";

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
    if (roomId) {
      start({
        roomId,
        onScoresUpdated(newScores: Score[]) {
          setScores(newScores);
        },
        onGameOver(winner: string) {
          router.push(`/game-over?winner=${winner}`);
        },
      });
    }
  }, [params]);

  return (
    <main className="relative">
      <canvas id="canvas"></canvas>
      <div className="absolute top-4 right-4">
        <ScoreBoard scores={scores} />
      </div>
    </main>
  );
}
