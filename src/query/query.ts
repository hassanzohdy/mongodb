import {
  AggregateOptions,
  CountDocumentsOptions,
  ExplainVerbosityLike,
  FindCursor,
  FindOptions,
  UpdateFilter,
  UpdateOptions,
} from "mongodb";
import { Database, database } from "../database";
import { Document, Filter, ModelDocument } from "../model/types";

export class Query {
  /**
   * Connection instance
   */
  protected database: Database = database;

  /**
   * Set the database instance
   */
  public setDatabase(database: Database) {
    this.database = database;

    return this;
  }

  /**
   * Get collection query for the given collection name
   */
  public query(collection: string) {
    return this.database.collection(collection);
  }

  /**
   * Create a new document in the given collection
   */
  public async create(collection: string, data: Document) {
    const query = this.query(collection);

    const result = await query.insertOne(data);

    return {
      ...data,
      _id: result.insertedId,
    } as ModelDocument;
  }

  /**
   * Create many documents in the given collection
   */
  public async createMany(collection: string, data: Document[]) {
    const query = this.query(collection);

    const result = await query.insertMany(data);

    return data.map((data, index) => ({
      ...data,
      _id: result.insertedIds[index],
    }));
  }

  /**
   * Update model by the given id
   */
  public async update(
    collection: string,
    filter: Filter,
    data: Document,
  ): Promise<Partial<ModelDocument> | null> {
    // get the query of the current collection
    const query = this.query(collection);

    const result = await query.findOneAndUpdate(
      filter,
      {
        $set: data,
      },
      {
        returnDocument: "after",
      },
    );

    return result.ok ? result.value : null;
  }

  /**
   * Update many documents
   */
  public async updateMany(
    collection: string,
    filter: Filter,
    update: UpdateFilter<Document>,
    options?: UpdateOptions,
  ) {
    return await this.query(collection).updateMany(filter, update, options);
  }

  /**
   * Replace the entire document for the given document id with the given new data
   */
  public async replace(
    collection: string,
    filter: Filter,
    data: Document,
  ): Promise<Partial<ModelDocument> | null> {
    const query = this.query(collection);

    const result = await query.findOneAndReplace(filter, data, {
      returnDocument: "after",
    });

    return result.ok ? result.value : null;
  }

  /**
   * Find and update the document for the given filter with the given data or create a new document/record
   * if filter has no matching
   */
  public async upsert(
    collection: string,
    filter: Filter,
    data: Document,
  ): Promise<Partial<ModelDocument> | null> {
    // get the query of the current collection
    const query = this.query(collection);

    // execute the update operation
    const result = await query.findOneAndUpdate(
      filter,
      {
        $set: data,
      },
      {
        returnDocument: "after",
        upsert: true,
      },
    );

    return result.ok ? result.value : null;
  }

  /**
   * Perform a single delete operation for the given collection
   */
  public async deleteOne(
    collection: string,
    filter?: Filter,
  ): Promise<boolean> {
    const query = this.query(collection);

    const result = await query.deleteOne(filter);

    return result.deletedCount > 0;
  }

  /**
   * Delete multiple documents from the given collection
   */
  public async delete(
    collection: string,
    filter: Filter = {},
  ): Promise<number> {
    const query = this.query(collection);

    const result = await query.deleteMany(filter);

    return result.deletedCount;
  }

  /**
   * Find a single document for the given collection with the given filter
   */
  public async first<T = Document>(
    collection: string,
    filter: Filter = {},
    findOptions?: FindOptions,
  ) {
    const query = this.query(collection);

    return await query.findOne<T>(filter, findOptions);
  }

  /**
   * Find last document for the given collection with the given filter
   */
  public async last(
    collection: string,
    filter: Filter = {},
    options?: FindOptions,
  ) {
    const query = this.query(collection);

    const results = await query
      .find(filter, options)
      .sort({
        id: "desc",
      })
      .limit(1)
      .toArray();

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find multiple document for the given collection with the given filter
   */
  public async list(
    collection: string,
    filter: Filter = {},
    queryHandler?: (query: FindCursor) => void,
    findOptions?: FindOptions,
  ) {
    const query = this.query(collection);

    const findOperation = query.find(filter, findOptions);

    if (queryHandler) {
      queryHandler(findOperation);
    }

    return await findOperation.toArray();
  }

  /**
   * Find latest documents for the given collection with the given filter
   */
  public async latest(
    collection: string,
    filter: Filter = {},
    findOptions?: FindOptions,
  ) {
    const query = this.query(collection);

    return await query
      .find(filter, findOptions)
      .sort({
        id: "desc",
      })
      .toArray();
  }

  /**
   * Get distinct values for the given collection with the given filter
   */
  public async distinct(
    collection: string,
    field: string,
    filter: Filter = {},
  ) {
    const query = this.query(collection);

    return await query.distinct(field, filter);
  }

  /**
   * Count documents for the given collection with the given filter
   */
  public async count(
    collection: string,
    filter: Filter = {},
    options?: CountDocumentsOptions,
  ) {
    return await this.query(collection).countDocuments(filter, options);
  }

  /**
   * Create an explain fetch query
   */
  public async explain(
    collection: string,
    filter: Filter = {},
    findOptions?: FindOptions,
    verbosity?: ExplainVerbosityLike,
  ) {
    return await this.query(collection)
      .find(filter, {
        ...(findOptions || {}),
        explain: true,
      })
      .explain(verbosity);
  }

  /**
   * Create aggregate query
   */
  public async aggregate(
    collection: string,
    pipeline: Document[],
    options?: AggregateOptions,
  ) {
    return this.query(collection).aggregate(pipeline, options);
  }
}

export const query = new Query();
