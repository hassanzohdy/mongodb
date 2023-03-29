import { Collection } from "mongodb";
import { database, Database } from "../database";
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
   * Model associated output
   */
  public static output?: any;

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
    // get static output class
    const Output = this.getStaticProperty("output");

    // if the model has a Output class
    if (Output) {
      // then return the Output instance and call `toJSON` method
      return await new Output(this).toJSON();
    }

    // otherwise return the data object
    return (this as any).publicData;
  }

  /**
   * Get current output instance
   */
  public getOutput(data?: Document) {
    // get static output class
    const Output = this.getStaticProperty("output");

    return Output ? new Output(data) : data;
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
