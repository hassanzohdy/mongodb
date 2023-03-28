import events from "@mongez/events";
import { log } from "@mongez/logger";
import { MongoClient } from "mongodb";
import database, { Database } from "./database";

export type ConnectionEvent = "connected" | "error" | "close";

export type DatabaseConfigurations = {
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
  dbAuth: string;
};

export class Connection {
  /**
   * Mongo Client
   */
  public client?: MongoClient;

  /**
   * Database instance
   */
  public database!: Database;

  /**
   * A flag to check if the connection is established
   */
  protected isConnectionEstablished = false;

  /**
   * Database configurations
   */
  public configurations: DatabaseConfigurations = {
    host: "localhost",
    port: 27017,
    username: "",
    password: "",
    name: "mongez",
    dbAuth: "",
  };

  /**
   * Connect to the database
   */
  public async connect(databaseConfigurations?: DatabaseConfigurations) {
    if (this.isConnectionEstablished) return;

    if (databaseConfigurations) {
      this.configurations = {
        ...this.configurations,
        ...databaseConfigurations,
      };
    }

    const { host, port, username, password, name, dbAuth } =
      this.configurations;

    try {
      log.info("database", "connection", "Connecting to the database");
      this.client = await MongoClient.connect(`mongodb://${host}:${port}`, {
        auth: {
          username: username,
          password: password,
        },
        // add database authentication here
        authSource: dbAuth,
      });

      const mongoDBDatabase = await this.client.db(name);

      this.database = database.setDatabase(mongoDBDatabase);

      this.isConnectionEstablished = true;

      this.database.setConnection(this);

      // listen on connection close
      this.client.on("close", () => {
        this.trigger("close", this);
      });

      if (!username || !password) {
        log.warn(
          "database",
          "connection",
          "Connected, but you are not making a secure authenticated connection!",
        );
      } else {
        log.success("database", "connection", "Connected to the database");
      }

      this.trigger("connected", this);
    } catch (error) {
      log.error("database", "connection", error);

      this.trigger("error", error);
    }
  }

  /**
   * Check if the connection is established
   */
  public isConnected() {
    return this.isConnectionEstablished;
  }

  /**
   * Trigger the given event
   */
  protected trigger(eventName: ConnectionEvent, ...args: any[]) {
    return events.trigger(`database.connection.${eventName}`, ...args);
  }

  /**
   * Subscribe to one of connection events
   */
  public on(eventName: ConnectionEvent, callback: any) {
    return events.subscribe(`database.connection.${eventName}`, callback);
  }
}

const connection = new Connection();

export default connection;
