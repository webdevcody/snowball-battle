"use client";

import clsx from "clsx";
import { RabbitIcon, SnailIcon, TurtleIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

export function LatencyIcon({
  latency,
  iconSize = 24,
}: {
  latency: number;
  iconSize?: number;
}) {
  let speed: "FAST" | "OK" | "SLOW";

  if (latency <= 100) {
    speed = "FAST";
  } else if (latency <= 200) {
    speed = "OK";
  } else {
    speed = "SLOW";
  }
  const icon = {
    FAST: <RabbitIcon size={iconSize} />,
    OK: <TurtleIcon size={iconSize} />,
    SLOW: <SnailIcon size={iconSize} />,
  }[speed];

  return latency === 0 ? (
    <div className="flex gap-2 items-center">
      <div className="animate-spin w-4 h-4 border-t-2 border-b-2 border-white rounded-full" />{" "}
      <div>? ms</div>
    </div>
  ) : (
    <div
      className={clsx("flex gap-2 items-center", {
        "text-green-400": speed === "FAST",
        "text-yellow-400": speed === "OK",
        "text-red-400": speed === "SLOW",
      })}
    >
      {icon} {latency} ms
    </div>
  );
}
