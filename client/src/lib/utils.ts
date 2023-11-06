import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getNickname() {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem("nickname") ?? "anonymous";
  }
  return "anonymous";
}

export function persistNickname(newNickname: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("nickname", newNickname);
  }
}
