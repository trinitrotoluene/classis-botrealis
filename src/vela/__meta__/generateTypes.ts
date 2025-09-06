import fs from "fs";
import path from "path";
import { compileFromFile } from "json-schema-to-typescript";
import { logger } from "@src/logger";

const inputDir = "./src/vela/__schema__";
const outputDir = "./src/vela/__generated__";

fs.rmdirSync(outputDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

const schemaNames: Array<{ name: string; metadata: { isGlobal: boolean } }> =
  [];

const files = fs.readdirSync(inputDir);

for (const file of files) {
  if (file.endsWith(".schema.json")) {
    const baseName = path.basename(file, ".schema.json");
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, `${baseName}.ts`);

    const rawSchema = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
    const isGlobalEntity = !!rawSchema["x-global-entity"];

    let ts = await compileFromFile(inputPath, {});
    ts = ts.replaceAll("[k: string]: unknown;", "");

    fs.writeFileSync(outputPath, ts);
    logger.info(`Generated: ${outputPath}`);
    schemaNames.push({
      name: baseName,
      metadata: { isGlobal: isGlobalEntity },
    });
  }
}
const bitcraftSchemaNames = schemaNames.filter((x) =>
  x.name.startsWith("Bitcraft"),
);
const systemSchemaNames = schemaNames.filter(
  (x) =>
    !x.name.startsWith("Bitcraft") &&
    !x.name.startsWith("Envelope") &&
    !x.name.startsWith("UpdateEnvelope"),
);

const indexContent = `// Exports
${schemaNames.map((x) => `export * from "./${x.name}"`).join(";\n")}

${[...bitcraftSchemaNames, ...systemSchemaNames].map((x) => `import type {${x.name}} from "./${x.name}"`).join(";\n")}

export enum BitcraftEntities {
  ${bitcraftSchemaNames.map((x) => `${x.name} = "${x.name}"`).join(",\n  ")}
}

export enum SystemEntities {
  ${systemSchemaNames.map((x) => `${x.name} = "${x.name}"`).join(",\n  ")}
}

// All entity map - use this for event subscriptions
export type TAllEntityMap = {
  ${bitcraftSchemaNames.map((x) => `${x.name}: ${x.name}`).join(",\n  ")},
  ${systemSchemaNames.map((x) => `${x.name}: ${x.name}`).join(",\n  ")}
}

// Entities are by default partitioned by region
export type TRegionalEntityMap = {
  ${bitcraftSchemaNames
    .filter((x) => !x.metadata.isGlobal)
    .map((x) => `${x.name}: ${x.name}`)
    .join(",\n  ")},
  ${systemSchemaNames
    .filter((x) => !x.metadata.isGlobal)
    .map((x) => `${x.name}: ${x.name}`)
    .join(",\n  ")}
}

// These entities are global. There is some nuance to how these caches work,
// they are NOT cleared by the event gateways on restart to avoid them interfering with each other.
export type TGlobalEntityMap = {
  ${bitcraftSchemaNames
    .filter((x) => x.metadata.isGlobal)
    .map((x) => `${x.name}: ${x.name}`)
    .join(",\n  ")}
}
`;

fs.writeFileSync(path.join(outputDir, "index.ts"), indexContent);
