import { DatabaseSync } from "node:sqlite";
import { config } from "../config.js";

const database = new DatabaseSync(config.databasePath);

export { database };
