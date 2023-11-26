import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// TODO move to near other santa stuff and export 
type SantaColor = "Red" | "Green" | "Blue";
const DEFAULT_SANTA_COLOR: SantaColor = "Red";

const DEFAULT_NICKNAME = "anonymous";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getNickname() {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem("nickname") ?? DEFAULT_NICKNAME;
  }
  return DEFAULT_NICKNAME;
}

export function persistNickname(newNickname: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("nickname", newNickname);
  }
}

export function getSantaColor() {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem("santa") ?? DEFAULT_SANTA_COLOR;
  }
  return DEFAULT_SANTA_COLOR;
}

export function persistSantaColor(newColor: SantaColor) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("santa", newColor);
  }
}