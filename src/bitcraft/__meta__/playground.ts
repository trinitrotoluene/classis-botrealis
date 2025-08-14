import { Config } from "@src/config";
import { logger } from "@src/logger";
import { BitcraftClient } from "../BitcraftClient";
import { subscribeAsync } from "../subscribeAsync";
import { jsonDump } from "../jsonDump";
import fs from "fs";

const client = new BitcraftClient(
  Config.bitcraft.uri,
  Config.bitcraft.module,
  Config.bitcraft.authToken ?? ""
);

client.onConnected.subscribe(async ({ conn }) => {
  await subscribeAsync(conn, ["SELECT * FROM resource_desc"]);

  logger.info("Dumping data");
  fs.mkdirSync(".bitcraft", { recursive: true });

  fs.writeFileSync(
    ".bitcraft/resourceDesc.json",
    jsonDump([...conn.db.resourceDesc.iter()])
  );

  logger.info("Done");
});

client.connect();

await new Promise(() => {});
