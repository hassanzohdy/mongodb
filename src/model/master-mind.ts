import { database, Database } from "../database";

export class MasterMind {
  /**
   * Master Mind Collection name
   */
  public collection = "MasterMind";

  /**
   * Connection instance
   */
  public database: Database = database;

  /**
   * Get last id of the given collection
   */
  public async getLastId(collection: string): Promise<number> {
    const query = this.database.collection(this.collection);

    const collectionDocument = await query.findOne({
      collection: collection,
    });

    return collectionDocument ? collectionDocument.id : 0;
  }

  /**
   * Generate next id for the given collection name
   */
  public async generateNextId(
    collection: string,
    incrementIdBy = 1,
    initialId = 1,
  ): Promise<number> {
    const query = this.database.collection(this.collection);

    const collectionDocument = await query.findOne({
      collection: collection,
    });

    if (collectionDocument) {
      const nextId = collectionDocument.id + incrementIdBy;

      // update the collection with the latest id
      await query.updateOne(
        {
          collection: collection,
        },
        {
          $set: {
            id: nextId,
          },
        },
      );

      return nextId;
    } else {
      // if the collection is not found in the master mind table
      // create a new record for it
      await query.insertOne({
        collection: collection,
        id: initialId,
      });

      return initialId;
    }
  }
}

export const masterMind = new MasterMind();
