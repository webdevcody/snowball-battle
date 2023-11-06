import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getNickname() {
  return localStorage.getItem("nickname") ?? "anonymous";
}

export function persistNickname(newNickName: string) {
  return localStorage.setItem("nickname", newNickName);
}
