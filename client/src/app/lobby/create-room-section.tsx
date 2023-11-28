"use client";

import {
  SelectValue,
  SelectTrigger,
  SelectLabel,
  SelectItem,
  SelectGroup,
  SelectContent,
  Select,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { REGIONS, RegionValues, createLobby } from "@/api/lobby";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useRegionLatencies } from "./use-region-latencies";
import { LatencyIcon } from "./latency-icon";
import { Region } from "@hathora/cloud-sdk-typescript/dist/sdk/models/shared";
import { getSantaColor, persistSantaColor } from "@/lib/utils";
import { SANTA_COLORS, SantaColor, getIconDetails } from "@/lib/player-options";

export function CreateRoomSection({ onRoomCreated }) {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [capacity, setCapacity] = useState(8);
  const [region, setRegion] = useState<RegionValues>("Washington_DC");
  const { getLatency } = useRegionLatencies();
  const [santa, setSanta] = useState<SantaColor>(getSantaColor() as SantaColor);

  async function createNewRoom() {
    onRoomCreated();
    const lobby = await createLobby({ roomName, region, capacity });
    router.push(`/game?roomId=${lobby.roomId}`);
  }

  return (
    <form
      className="bg-gray-700 rounded-lg p-4 flex flex-col gap-8"
      onSubmit={(e) => {
        e.preventDefault();
        persistSantaColor(santa);
        createNewRoom();
      }}
    >
      <div className="flex flex-col gap-4">
        <Label>Room Name</Label>
        <Input
          id="roomName"
          required
          name="roomName"
          placeholder="Enter room name"
          type="text"
          onChange={(e) => {
            setRoomName(e.target.value);
          }}
        />
      </div>

      <div className="flex flex-col gap-4">
        <Label>Region</Label>
        <Select
          value={region}
          required
          onValueChange={(value) => {
            setRegion(value as Region);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a region" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Regions</SelectLabel>
              {REGIONS.map((region) => (
                <SelectItem key={region} value={region}>
                  <div className="flex gap-4">
                    <div>{region}</div>
                    <LatencyIcon iconSize={16} latency={getLatency(region)} />
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
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
      <div className="flex flex-col gap-4">
        <Label>Max Players</Label>
        <Slider
          id="maxPlayers"
          minStepsBetweenThumbs={1}
          max={16}
          min={2}
          name="maxPlayers"
          value={[capacity]}
          onValueChange={(capacity) => {
            setCapacity(capacity[0]);
          }}
        />
        <p className="text-gray-300 mt-2">Max Players: {capacity}</p>
      </div>
      <Button type="submit">Create Room</Button>
    </form>
  );
}
