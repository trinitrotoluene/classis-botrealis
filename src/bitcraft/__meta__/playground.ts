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
  await subscribeAsync(conn, [
    `SELECT b.* FROM building_state b 
       JOIN building_desc d ON b.building_description_id = d.id 
          WHERE b.claim_entity_id = '648518346353424439' 
            AND (
              d.name = 'Exquisite Barter Stall' OR d.name = 'Rough Barter Stall' OR d.name = 'Sturdy Barter Stall'
            )`,
  ]);

  await subscribeAsync(conn, [
    `SELECT * FROM inventory_state WHERE owner_entity_id = '648518346374355118'`,
  ]);

  logger.info("Dumping data");
  fs.mkdirSync(".bitcraft", { recursive: true });

  fs.writeFileSync(
    ".bitcraft/buildingState.json",
    jsonDump([...conn.db.buildingState.iter()])
  );

  fs.writeFileSync(
    ".bitcraft/inventoryState.json",
    jsonDump([...conn.db.inventoryState.iter()])
  );

  logger.info("Done");
});

client.connect();

await new Promise(() => {});
