"use client";

export default function CreatingGameLoader() {
  return (
    <section className="w-full h-screen flex items-center justify-center bg-gray-900">
      <div className="flex flex-col items-center space-y-4 text-center gap-8">
        <h1 className="text-5xl font-bold tracking-tighter text-white">
          Creating your game...
        </h1>
        <div className="animate-spin w-16 h-16 border-t-2 border-b-2 border-white rounded-full" />
        <p className="text-xl text-zinc-200">
          Please wait while we set up your game.
        </p>
      </div>
    </section>
  );
}
