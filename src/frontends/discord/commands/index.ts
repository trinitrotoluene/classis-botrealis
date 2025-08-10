import { dirname } from "path";
import { fileURLToPath } from "url";
import { getCommands } from "./__meta__";

const __filename = fileURLToPath(import.meta.url);
const commandsDir = dirname(__filename);

const commands = await getCommands(commandsDir);

export { commands as CommandsCollection };
