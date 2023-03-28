import { clone } from "@mongez/reinforcements";
import ModelAggregate from "./ModelAggregate";
import ModelSync from "./ModelSync";
import RelationshipWithMany from "./RelationshipWithMany";
import CrudModel from "./crud-model";
import Model from "./model";
import { ChildModel, ModelDocument } from "./types";

export default abstract class RelationshipModel extends CrudModel {
  /**
   * Sync with list
   */
  public syncWith: ModelSync[] = [];

  /**
   * Get relationship with the given model class
   */
  public hasMany<T extends Model = Model>(
    modelClass: typeof Model,
    column: string
  ) {
    return new RelationshipWithMany<T>(this as any, modelClass, column);
  }

  /**
   * Get new aggregate for current model
   */
  public static aggregate<T>(this: ChildModel<T>) {
    return new ModelAggregate<T>(this);
  }

  /**
   * Sync with the given model
   */
  public static sync(columns: string | string[], embedMethod = "embedData") {
    return new ModelSync(this as typeof Model, columns, embedMethod);
  }

  /**
   * Sync data on saving
   */
  public startSyncing(saveMode: "create" | "update") {
    for (const modelSync of this.syncWith) {
      modelSync.sync(this as any, saveMode);
    }
  }

  /**
   * Sync destruction
   * Called when destroy method is called
   */
  public syncDestruction() {
    for (const modelSync of this.syncWith) {
      modelSync.syncDestruction(this as any);
    }
  }

  /**
   * The syncing model (That calls startSyncing) is being embedded in multiple documents of current model
   * I.e Country.syncMany('cities') while current model is City
   */
  public static syncMany(
    columns: string | string[],
    embedMethod = "embedData"
  ) {
    return new ModelSync(this as typeof Model, columns, embedMethod).syncMany();
  }

  /**
   * Reassociate a model/object/document with the current model
   * If the model is already associated, it will be updated
   * If not, it will be associated
   * the model/document must have an id
   *
   * If it is a model, you can set the embed method to use
   */
  public reassociate(
    this: Model,
    column: string,
    model: Model | ModelDocument,
    embedWith?: string
  ) {
    const columnValue =
      model instanceof Model
        ? embedWith
          ? (model as any)[embedWith]()
          : model.embeddedData
        : model;

    if (columnValue === undefined) return;

    // make a deep copy so when changing the data, it won't affect the original data
    const documentsList = clone(this.get(column, []));

    const index = documentsList.findIndex(
      (doc: any) => doc.id === columnValue.id
    );

    if (index === -1) {
      documentsList.push(columnValue);
    } else {
      documentsList[index] = columnValue;
    }

    this.set(column, [...documentsList]);

    return this;
  }

  /**
   * Associate a model with the current model
   */
  public associate(
    this: Model,
    column: string,
    model: Model | ModelDocument,
    embedWith?: string
  ) {
    const columnValue =
      model instanceof Model
        ? embedWith
          ? (model as any)[embedWith]()
          : model.embeddedData
        : model;

    if (columnValue === undefined) return this;

    const documentsList = this.get(column, []);

    documentsList.push(columnValue);

    this.set(column, documentsList);

    return this;
  }

  /**
   * Disassociate a model with the current model
   */
  public disassociate(
    this: Model,
    column: string,
    model: Model | ModelDocument
  ) {
    const columnValue = model instanceof Model ? model.embeddedData : model;

    if (columnValue === undefined) return this;

    const documentsList = this.get(column, []);

    if (!Array.isArray(documentsList)) return this;

    const index = documentsList.findIndex(
      (doc: any) => doc.id === columnValue.id
    );

    if (index !== -1) {
      documentsList.splice(index, 1);
    }

    this.set(column, documentsList);

    return this;
  }
}
