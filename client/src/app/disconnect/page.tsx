"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { christmasFontNormal } from "../fonts";
import Image from "next/image";

export default function Disconnect() {
  return (
    <main className="w-full text-white h-screen flex justify-center items-center flex-col gap-8">
      <Image
        alt="Game Logo"
        className="mb-8 rounded-full"
        height="300"
        width="300"
        src="/crash.jpeg"
      />

      <h1 className={`text-4xl ${christmasFontNormal.className}`}>Uh Oh!</h1>

      <p className="text-xl">You lost connection to the room</p>

      <Button asChild>
        <Link href="/lobby">Play Again</Link>
      </Button>
    </main>
  );
}
