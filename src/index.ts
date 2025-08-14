import { configureDb } from "./database/db";
await configureDb();

import "./frontends/discord/bot";
