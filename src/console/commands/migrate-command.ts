import { Command } from "commander";
import databaseConfigurations from "config/database";
import { connectToDatabase } from "core/database";
import migrate, {
  listMigrations,
  setMigrationsList,
} from "core/database/migrate";

export function registerMigrationCommand(migrationsList: any[]) {
  return new Command("migrate")
    .description("Generate Database Migrations")
    .option("-f, --fresh", "Drop all migrations and generate fresh migrations")
    .option("-l, --list", "List all migrations")
    .action(options => {
      connectToDatabase(databaseConfigurations);
      setMigrationsList(migrationsList);
      if (options.list) {
        return listMigrations();
      }

      migrate(options.fresh);
    });
}
