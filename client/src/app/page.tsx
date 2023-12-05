"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SelectValue,
  SelectTrigger,
  SelectLabel,
  SelectItem,
  SelectGroup,
  SelectContent,
  Select,
} from "@/components/ui/select";
import {
  getNickname,
  persistNickname,
  getSantaColor,
  persistSantaColor,
} from "@/lib/utils";
import { SantaColor, getIconDetails, SANTA_COLORS } from "@/lib/player-options";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { christmasFontNormal } from "./fonts";

export default function LandingPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState(getNickname());
  const [santa, setSanta] = useState<SantaColor>(getSantaColor() as SantaColor);

  return (
    <section className="w-full pt-24 h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-900">
      <h1
        className={`text-5xl font-bold text-gray-800 dark:text-gray-200 mb-8 ${christmasFontNormal.className}`}
      >
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
      <form
        className="bg-gray-700 rounded-lg p-4 flex flex-col gap-8"
        onSubmit={(e) => {
          e.preventDefault();
          persistNickname(nickname);
          persistSantaColor(santa);
          router.push("/lobby");
        }}
      >
        <div className="flex flex-col gap-4">
          <Label>Nickname</Label>
          <Input
            id="nickname"
            required
            value={nickname}
            name="nickname"
            placeholder="Enter your player name"
            type="text"
            onChange={(e) => {
              setNickname(e.target.value);
            }}
          />
        </div>
        <div className="flex flex-col gap-4">
          <Label>Santa Color</Label>
          <Select
            value={santa}
            required
            onValueChange={(selectedSanta: SantaColor) => {
              setSanta(selectedSanta);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your Santa" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Select Icon</SelectLabel>
                {SANTA_COLORS.map((color) => {
                  const { label, image, alt } = getIconDetails(color);
                  return (
                    <SelectItem value={label} key={label}>
                      <div className="flex gap-4">
                        <Image
                          src={`/${image}`}
                          alt={alt}
                          width={16}
                          height={16}
                        />
                        <div>{label}</div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit">Play Now</Button>
      </form>
    </section>
  );
}
