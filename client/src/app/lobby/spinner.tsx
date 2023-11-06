"use client";

export default function LoadingLobbySpinner() {
  return (
    <section className="w-full h-screen flex items-center justify-center ">
      <div className="flex flex-col items-center space-y-4 text-center gap-8">
        <div className="animate-spin w-16 h-16 border-t-2 border-b-2 border-white rounded-full" />
        <p className="text-xl text-zinc-200">
          Please wait while we check for games
        </p>
      </div>
    </section>
  );
}
