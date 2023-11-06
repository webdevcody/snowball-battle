"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function GameOver() {
  const params = useSearchParams();

  return (
    <main className="w-full text-white h-screen flex justify-center items-center flex-col gap-8">
      <h1 className="text-4xl">Game Over!</h1>

      <p className="text-xl">{params.get("winner")} won the match!</p>

      <Button asChild>
        <Link href="/">Play Again</Link>
      </Button>
    </main>
  );
}
