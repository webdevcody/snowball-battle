"use client";

import { Button } from "@/components/ui/button";
import { signIn, signOut, useSession } from "next-auth/react";

export function Header() {
  const session = useSession();

  return (
    <div className="mt-4 mr-4 flex justify-end">
      {session.data ? (
        <Button onClick={() => signOut({ callbackUrl: "/" })}>Sign Out</Button>
      ) : (
        <Button onClick={() => signIn("google")}>Sign In</Button>
      )}
    </div>
  );
}
