import connection from "../connection";
import { DatabaseConfigurations } from "../types";

export function connectToDatabase(
  databaseConfigurations?: DatabaseConfigurations
) {
  connection.connect(databaseConfigurations);
}
