import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  SantaColor,
  DEFAULT_NICKNAME,
  DEFAULT_SANTA_COLOR,
} from "./player-options";

const NICKNAME_KEY = "nickname";
const SANTA_COLOR_KEY = "santa";

function getItemFromLocalStorage(key: string, defaultValue: string) {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem(key) ?? defaultValue;
  }
  return defaultValue;
}

function persistItemToLocalStorage(key: string, value: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, value);
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getNickname() {
  return getItemFromLocalStorage(NICKNAME_KEY, DEFAULT_NICKNAME);
}

export function persistNickname(newNickname: string) {
  persistItemToLocalStorage(NICKNAME_KEY, newNickname);
}

export function getSantaColor() {
  return getItemFromLocalStorage(SANTA_COLOR_KEY, DEFAULT_SANTA_COLOR);
}

export function persistSantaColor(newColor: SantaColor) {
  persistItemToLocalStorage(SANTA_COLOR_KEY, newColor);
}
