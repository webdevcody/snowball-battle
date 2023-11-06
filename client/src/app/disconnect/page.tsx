"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Disconnect() {
  return (
    <main className="w-full text-white h-screen flex justify-center items-center flex-col gap-8">
      <h1 className="text-4xl">Uh Oh!</h1>

      <p className="text-xl">You lost connection to the room</p>

      <Button asChild>
        <Link href="/lobby">Play Again</Link>
      </Button>
    </main>
  );
}
