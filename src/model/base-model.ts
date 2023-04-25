import { Collection } from "mongodb";
import { bluePrint } from "../blueprint";
import { database, Database } from "../database";
import { masterMind } from "./master-mind";
import { Model } from "./model";
import { ModelEvents } from "./model-events";
import { ChildModel, Document } from "./types";
import { Random } from "@mongez/reinforcements";

const modelEvents = new Map<string, ModelEvents>();

const getModelEvent = (collection: string) => {
  let eventsInstance = modelEvents.get(collection);

  if (!eventsInstance) {
    eventsInstance = new ModelEvents(collection);
    modelEvents.set(collection, eventsInstance);
  }

  return eventsInstance;
};

export abstract class BaseModel {
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
  public static initialId?: number;

  /**
   * Define the amount to eb incremented by for the next generated id
   */
  public static incrementIdBy?: number;

  /**
   * Primary id column
   */
  public static primaryIdColumn = "id";

  /**
   * Get collection query
   */
  public static query() {
    return this.database.collection(this.collection);
  }

  /**
   * Get increment id by
   */
  public static getIncrementIdBy() {
    if (this.incrementIdBy) return this.incrementIdBy;

    // return Random number
    return Random.number(100, 10000);
  }

  /**
   * Get initial id
   */
  public static getInitialId() {
    if (this.initialId) return this.initialId;

    // return Random number
    return Random.number(1000, 499999);
  }

  /**
   * Generate next id
   */
  public static async generateNextId() {
    return await masterMind.generateNextId(
      this.collection,
      this.incrementIdBy,
      this.initialId,
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
  public getStaticProperty(property: keyof typeof BaseModel) {
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
    return getModelEvent(this.collection);
  }

  /**
   * Get model events for current model
   */
  public getModelEvents() {
    return getModelEvent(this.getCollection()) as ModelEvents;
  }

  /**
   * Get base model events
   */
  public getBaseModelEvents() {
    return getModelEvent("__baseModel__");
  }

  /**
   * Get model blueprint
   */
  public static blueprint() {
    return bluePrint(this as any);
  }
}
