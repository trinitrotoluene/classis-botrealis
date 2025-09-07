import type { HeartbeatEvent, IEventContext } from "@src/vela";
import NodeCache from "node-cache";

const cache = new NodeCache({});

const initDateEpoch = Math.floor(new Date().getTime() / 1000);

export interface ServiceStatus {
  name: string;
  lastSeen: Date;
}

export async function onHeartbeat(
  _ctx: IEventContext,
  heartbeat: HeartbeatEvent,
) {
  cache.set<ServiceStatus>(heartbeat.Application, {
    name: heartbeat.Application,
    lastSeen: new Date(heartbeat.PublishedAt),
  });
}

export interface ServiceStatusSummary {
  initDateEpoch: number;
  services: ServiceStatus[];
}

export function getServiceStatus(): ServiceStatusSummary {
  const services = cache
    .keys()
    .map((x) => cache.get<ServiceStatus>(x))
    .filter((x) => !!x);

  return {
    initDateEpoch,
    services,
  };
}
