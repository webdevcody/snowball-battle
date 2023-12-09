type MapOption = {
  displayName: string;
  fileName: string;
  validSpawnPoints: { x: number; y: number }[];
};

export const MAP_OPTIONS = new Map<string, MapOption>([
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
]);
