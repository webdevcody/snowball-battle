import { HATHORA_APP_ID } from "@/config";
import { HathoraCloud } from "@hathora/cloud-sdk-typescript";

export const hathoraClient = new HathoraCloud({
  appId: HATHORA_APP_ID,
});
