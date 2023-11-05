import { HATHORA_APP_ID, USE_LOCAL_WS } from "@/config";
import { ConnectionInfoV2, RoomV2Api } from "@hathora/hathora-cloud-sdk";
const roomClient = new RoomV2Api();

export async function getConnectionInfo(
  roomId: string
): Promise<ConnectionInfoV2> {
  if (USE_LOCAL_WS) {
    return {
      exposedPort: {
        host: "localhost",
        port: 8000,
      },
    } as ConnectionInfoV2;
  } else {
    return roomClient.getConnectionInfo(HATHORA_APP_ID, roomId);
  }
}
