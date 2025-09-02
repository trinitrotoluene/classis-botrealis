/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */

const { makeKyselyHook } = require("kanel-kysely");

const customisedPostRenderHook = (path, lines) => {
  if (path.endsWith("Database.ts")) {
    const exportLine = lines.findIndex((l) => l.startsWith("type Database"));
    lines.splice(
      exportLine,
      1,
      lines[exportLine].replace("type", "export type"),
    );

    const defaultExportLine = lines.findIndex((l) =>
      l.startsWith("export default"),
    );
    lines.splice(defaultExportLine, 1);
  }

  return lines;
};

/** @type {import('kanel').Config} */
module.exports = {
  connection: process.env.DATABASE_URL,
  preDeleteOutputFolder: true,
  outputPath: "./src/database/__generated__",
  preRenderHooks: [makeKyselyHook()],
  postRenderHooks: [customisedPostRenderHook],
};
