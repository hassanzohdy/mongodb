import { Collection } from "mongodb";
import database, { Database } from "../database";
import masterMind from "./master-mind";
import Model from "./model";
import ModelEvents from "./model-events";
import { ChildModel, Document } from "./types";

export default abstract class BaseModel {
  /**
   * Collection Name
   */
  public static collection: string;

  /**
   * Connection instance
   */
  public static database: Database = database;

  /**
   * Model associated resource
   */
  public static resource?: any;

  /**
   * Missing key symbol
   */
  public static MISSING_KEY = Symbol("MISSING_KEY");

  /**
   * Define the initial value of the id
   */
  public static initialId = 1;

  /**
   * Define the amount to eb incremented by for the next generated id
   */
  public static incrementIdBy = 1;

  /**
   * Primary id column
   */
  public static primaryIdColumn = "id";

  /**
   * Model Events
   */
  protected static modelEvents?: ModelEvents<any>;

  /**
   * Get collection query
   */
  public static query() {
    return this.database.collection(this.collection);
  }

  /**
   * Generate next id
   */
  public static async generateNextId() {
    return await masterMind.generateNextId(
      this.collection,
      this.incrementIdBy,
      this.initialId
    );
  }

  /**
   * Get last id of current model
   */
  public static async getLastId() {
    return await masterMind.getLastId(this.collection);
  }

  /**
   * Get an instance of child class
   */
  protected static self(data: Document) {
    return new (this as any)(data);
  }

  /**
   * Get collection name
   */
  public getCollection(): string {
    return this.getStaticProperty("collection");
  }

  /**
   * Get collection query
   */
  public getQuery(): Collection {
    return this.getStaticProperty("query")();
  }

  /**
   * Get database instance
   */
  public getDatabase(): Database {
    return this.getStaticProperty("database");
  }

  /**
   * Get static property
   */
  public getStaticProperty(property: keyof typeof Model) {
    return (this.constructor as any)[property];
  }

  /**
   * Prepare model for response
   */
  public async toJSON() {
    // get static resource class
    const resource = this.getStaticProperty("resource");

    // if the model has a resource class
    if (resource) {
      // then return the resource instance and call `toJSON` method
      return await new resource(this).toJSON();
    }

    // otherwise return the data object
    return (this as any).publicData;
  }

  /**
   * Get current resource instance
   */
  public getResource(data?: Document) {
    // get static resource class
    const resource = this.getStaticProperty("resource");

    // if the model has a resource class
    if (resource) {
      // then return the resource instance and call `toJSON` method
      return new resource(data || this);
    }

    return data;
  }

  /**
   * Get model events instance
   */
  public static events<T extends Model>(this: ChildModel<T>) {
    if (!this.modelEvents) {
      this.modelEvents = new ModelEvents<T>(this.collection);
    }

    return this.modelEvents;
  }
}
