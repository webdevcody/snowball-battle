type MapOption = {
  displayName: string;
  fileName: string;
  validSpawnPoints: { x: number; y: number }[];
};

export type MapKey = "originalMap" | "moreHidingSpots";

export const MAP_OPTIONS = new Map<MapKey, MapOption>([
  [
    "originalMap",
    {
      displayName: "Original",
      fileName: "map.tmx",
      validSpawnPoints: [
        {
          x: 813,
          y: 739,
        },
        {
          x: 1161,
          y: 1156,
        },
        {
          x: 1161,
          y: 1891,
        },
        {
          x: 1572,
          y: 2188,
        },
        {
          x: 2313,
          y: 2188,
        },
        {
          x: 2397,
          y: 1555,
        },
        {
          x: 2190,
          y: 859,
        },
        {
          x: 1773,
          y: 1471,
        },
      ],
    },
  ],
  [
    "moreHidingSpots",
    {
      displayName: "More Hiding Spots",
      fileName: "map-more-hiding.tmx",
      validSpawnPoints: [
        {
          x: 813,
          y: 739,
        },
        {
          x: 1710,
          y: 1471,
        },
        {
          x: 2000,
          y: 800,
        },
        {
          x: 1975,
          y: 1600,
        },
        {
          x: 2450,
          y: 790,
        },
        {
          x: 2621,
          y: 1556,
        },
        {
          x: 2424,
          y: 2345,
        },
        {
          x: 1638,
          y: 2465,
        },
        {
          x: 1126,
          y: 2409,
        },
        {
          x: 819,
          y: 2046,
        },
      ],
    },
  ],
]);
