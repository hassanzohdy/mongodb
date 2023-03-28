import { Command } from "commander";
import { getDatabaseConfigurations } from "../../config";
import migrate, { listMigrations, setMigrationsList } from "../../migrate";
import { connectToDatabase } from "../../utils";

export function registerMigrationCommand(migrationsList: any[]) {
  return new Command("migrate")
    .description("Generate Database Migrations")
    .option("-f, --fresh", "Drop all migrations and generate fresh migrations")
    .option("-l, --list", "List all migrations")
    .action((options) => {
      connectToDatabase(getDatabaseConfigurations());
      setMigrationsList(migrationsList);
      if (options.list) {
        return listMigrations();
      }

      migrate(options.fresh);
    });
}
