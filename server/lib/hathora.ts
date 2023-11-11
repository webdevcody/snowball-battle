import { HathoraCloud } from "@hathora/cloud-sdk-typescript";
import { HATHORA_APP_ID, HATHORA_TOKEN } from "./config";

export const hathoraSdk = new HathoraCloud({
  appId: HATHORA_APP_ID,
  security: {
    hathoraDevToken: HATHORA_TOKEN,
  },
});
