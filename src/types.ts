import { MongoClientOptions } from "mongodb";

export type DatabaseConfigurations = {
  /**
   * Database host
   */
  host: string;
  /**
   * Database port
   */
  port: number;
  /**
   * Database username
   */
  username: string;
  /**
   * Database password
   */
  password: string;
  /**
   * Database name
   */
  name: string;
  /**
   * Database authentication
   */
  dbAuth: string;
} & Partial<MongoClientOptions>;
