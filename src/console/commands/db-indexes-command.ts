import { Command } from "commander";
import databaseConfigurations from "config/database";
import { connectToDatabase } from "core/database";
import { dropAllDatabaseIndexes } from "core/database/dropAllDatabaseIndexes";
import { listDatabaseIndexes } from "core/database/helpers";

export function registerDatabaseIndexesCommand() {
  return new Command("db:indexes")
    .description("List all database indexes")
    .option("-d, --drop", "Drop all database indexes")
    .action((options) => {
      connectToDatabase(databaseConfigurations);
      if (options.drop) {
        return dropAllDatabaseIndexes();
      }

      listDatabaseIndexes();
    });
}
