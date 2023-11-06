"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { christmasFontNormal } from "../fonts";

export default function GameOver() {
  const params = useSearchParams();

  return (
    <main className="w-full text-white h-screen flex justify-center items-center flex-col gap-8">
      <h1 className={`text-4xl ${christmasFontNormal.className}`}>
        Game Over!
      </h1>

      <div className="text-xl">
        <span className="text-red-400">{params.get("winner")}</span> won the
        match!
      </div>

      <Button asChild>
        <Link href="/lobby">Play Again</Link>
      </Button>
    </main>
  );
}
