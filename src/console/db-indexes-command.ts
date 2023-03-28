import { Command } from "commander";
import { getDatabaseConfigurations } from "../config";
import {
  connectToDatabase,
  dropAllDatabaseIndexes,
  listDatabaseIndexes,
} from "../utils";

export function registerDatabaseIndexesCommand() {
  return new Command("db:indexes")
    .description("List all database indexes")
    .option("-d, --drop", "Drop all database indexes")
    .action((options) => {
      connectToDatabase(getDatabaseConfigurations());
      if (options.drop) {
        return dropAllDatabaseIndexes();
      }

      listDatabaseIndexes();
    });
}
