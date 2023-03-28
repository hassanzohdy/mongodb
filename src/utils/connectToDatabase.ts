import connection, { DatabaseConfigurations } from "../connection";

export function connectToDatabase(
  databaseConfigurations?: DatabaseConfigurations
) {
  connection.connect(databaseConfigurations);
}
