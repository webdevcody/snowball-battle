import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <section className="w-full h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <h1 className="text-5xl font-bold text-gray-800 dark:text-gray-200 mb-8">
        Welcome to Snowball Battle!
      </h1>
      <Image
        alt="Game Logo"
        className="mb-8 rounded-full"
        height="300"
        src="/battle.jpeg"
        style={{
          aspectRatio: "300/300",
          objectFit: "cover",
        }}
        width="300"
      />
      <Link href="/lobby">
        <Button variant="default">Play Now</Button>
      </Link>
    </section>
  );
}
