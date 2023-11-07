"use client";

import Image from "next/image";
import { christmasFontNormal } from "../fonts";

export default function CreatingGameLoader() {
  return (
    <section className="w-full h-screen flex items-center justify-center bg-gray-900">
      <div className="flex flex-col items-center space-y-4 text-center gap-8">
        <Image
          alt="Game Logo"
          className="mb-8 rounded-xl"
          height="300"
          width="300"
          src="/empty.jpeg"
        />
        <h1
          className={`text-5xl font-bold tracking-tighter text-white ${christmasFontNormal.className}`}
        >
          It is so peaceful, for now...
        </h1>
        <div className="animate-spin w-16 h-16 border-t-2 border-b-2 border-white rounded-full" />
        <p className="text-xl text-zinc-200">
          Please wait while we set up your game.
        </p>
      </div>
    </section>
  );
}
