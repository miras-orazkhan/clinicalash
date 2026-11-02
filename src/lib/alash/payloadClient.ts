import configPromise from "@payload-config";
import { getPayload } from "payload";

/** Единый инстанс Payload Local API для серверного кода (layout, API-роуты) */
let client: Awaited<ReturnType<typeof getPayload>> | null = null;

export async function getPayloadClient() {
  if (!client) client = await getPayload({ config: configPromise });
  return client;
}
