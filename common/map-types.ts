export type MapType = {
  height: number;
  width: number;
  version: string;
  orientation: 'orthogonal';
  tileWidth: number;
  tileHeight: number;
  backgroundColor: undefined | string;
  layers: TileLayerType[];
  tileSets: TileSheetType[];
  properties: unknown;
};

export type TileLayerType = {
  map: unknown;
  type: 'tile',
  name: string,
  opacity: 1,
  visible: true,
  properties: {},
  tiles: TileType[],
  horizontalFlips: unknown[],
  verticalFlips:  unknown[],
  diagonalFlips: unknown[]
}

export type TileSheetType = {
  firstGid: number;
  source: string;
  name: string;
  tileWidth: number;
  tileHeight: number;
  spacing: number | null;
  margin: number | null;
  tileOffset: unknown;
  properties: unknown;
  image: unknown;
  tiles: TileType[];
  terrainTypes: unknown[];
}

export type TileType = {
  id: number;
  gid: number;
  terrain?: unknown[],
  probability?: null | number;
  properties?: unknown;
  animations?: unknown[],
  objectGroups?: unknown[],
  image?: null | unknown;
}
