import { Config } from "@src/config";
import { logger } from "@src/logger";
import { jsonDump } from "../jsonDump";
import fs from "fs";

logger.info("Fetching schema");

async function dumpSchema(module: string) {
  const response = await fetch(
    `https://${Config.bitcraft.uri}/v1/database/${module}/schema?version=9`,
    {
      method: "GET",
    }
  );

  const responseData = await response.json();
  return { V9: responseData };
}

const mappedGlobalSchema = await dumpSchema("bitcraft-global");
const mappedSchema = await dumpSchema(Config.bitcraft.module);

fs.mkdirSync(".bitcraft", { recursive: true });
fs.writeFileSync(".bitcraft/schema-global.json", jsonDump(mappedGlobalSchema));
fs.writeFileSync(".bitcraft/schema.json", jsonDump(mappedSchema));

logger.info("Done!");
