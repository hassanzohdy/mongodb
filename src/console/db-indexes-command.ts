import { Command } from "commander";
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
      connectToDatabase();
      if (options.drop) {
        return dropAllDatabaseIndexes();
      }

      listDatabaseIndexes();
    });
}
