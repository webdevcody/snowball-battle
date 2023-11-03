"use client";

import { useEffect } from "react";
import { start } from "./game";

export default function Home() {
  useEffect(() => {
    start();
  }, []);

  return (
    <main className="">
      <canvas id="canvas"></canvas>
    </main>
  );
}
