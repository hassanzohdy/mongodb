import { getDatabaseConfigurations } from "../config";
import { connection } from "../connection";
import { DatabaseConfigurations } from "../types";

export function connectToDatabase(
  databaseConfigurations: DatabaseConfigurations = getDatabaseConfigurations()
) {
  connection.connect(databaseConfigurations);
}
