export const SANTA_COLORS = [
  "Red",
  "Green",
  "Blue",
  "Purple",
  "Yellow",
  "Teal",
] as const;
export type SantaOptions = typeof SANTA_COLORS;
export type SantaColor = SantaOptions[number];

type SantaIconDetails = {
  image: string;
  alt: string;
  label: SantaColor;
};
export function getIconDetails(santaColor: SantaColor) : SantaIconDetails {
  return {
    image: `santa-${santaColor.toLowerCase()}.png`,
    alt: `A ${santaColor.toLowerCase()} santa icon`,
    label: santaColor,
  };
}

export const DEFAULT_SANTA_COLOR: SantaColor = "Red";
export const DEFAULT_NICKNAME = "anonymous";
