"use client";

import { useEffect } from "react";
import { start } from "./game";
import { useSearchParams } from "next/navigation";

export default function Game() {
  const params = useSearchParams();

  useEffect(() => {
    const websocketUrl = params.get("websocketUrl");
    if (websocketUrl) {
      start({
        websocketUrl,
      });
    }
  }, [params]);

  return (
    <main>
      <canvas id="canvas"></canvas>
    </main>
  );
}
