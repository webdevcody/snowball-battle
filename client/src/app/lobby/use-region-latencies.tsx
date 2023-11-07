"use client";

import { DiscoveryV1Api, Region } from "@hathora/hathora-cloud-sdk";
import { useEffect, useState } from "react";

const discoveryClient = new DiscoveryV1Api();

const getMedian = (arr: number[]) => {
  const mid = Math.floor(arr.length / 2);
  arr.sort((a, b) => a - b);
  return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
};

const PING_CHECK_TIMEOUT =
  (process.env.NODE_ENV === "development" ? 3 : 7) * 1000;

const getRegionLatency = ({ region, host, port }) =>
  new Promise<{ region: string; latency: number }>((resolve) => {
    const latencies: number[] = [];
    let start1: number;
    let start2: number;
    let start3: number;
    let timeout2: ReturnType<typeof setTimeout>;
    let timeout3: ReturnType<typeof setTimeout>;

    const socket = new WebSocket(`wss://${host}:${port}`);

    const timeout = setTimeout(() => {
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      socket.close();
      resolve({ region, latency: Infinity });
    }, PING_CHECK_TIMEOUT);

    socket.addEventListener("open", () => {
      start1 = Date.now();
      socket.send("ping1");
      timeout2 = setTimeout(() => {
        start2 = Date.now();
        socket.send("ping2");
      }, 500);
      timeout3 = setTimeout(() => {
        start3 = Date.now();
        socket.send("ping3");
      }, 1000);
    });

    socket.addEventListener("message", (event) => {
      if (event.data === "ping1") {
        latencies.push(Date.now() - start1);
      } else if (event.data === "ping2") {
        latencies.push(Date.now() - start2);
      } else if (event.data === "ping3") {
        latencies.push(Date.now() - start3);
      }
      if (latencies.length === 3) {
        clearTimeout(timeout);
        socket.close();
        resolve({ region, latency: getMedian(latencies) });
      }
    });
  });

export function useRegionLatencies() {
  const [latencies, setLatencies] = useState<
    {
      region: Region;
      latency: number;
    }[]
  >();

  useEffect(() => {
    (async () => {
      const pingServers = await discoveryClient.getPingServiceEndpoints();
      const regionLatencies = (await Promise.all(
        pingServers.map(getRegionLatency)
      )) as {
        region: Region;
        latency: number;
      }[];
      setLatencies(regionLatencies);
    })();
  }, []);

  return latencies;
}
