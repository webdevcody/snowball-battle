"use client";

import { useEffect } from "react";
import { start } from "./game";
import { useSearchParams } from "next/navigation";

export default function Game() {
  const params = useSearchParams();

  useEffect(() => {
    const roomId = params.get("roomId");
    if (roomId) {
      start({
        roomId,
      });
    }
  }, [params]);

  return (
    <main>
      <canvas id="canvas"></canvas>
    </main>
  );
}
