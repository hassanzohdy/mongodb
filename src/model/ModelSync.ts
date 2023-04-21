import { areEqual } from "@mongez/reinforcements";
import { ModelAggregate } from "./ModelAggregate";
import { Model } from "./model";

type OnDelete = "unset" | "remove";

export class ModelSync {
  /**
   * What do do when model is deleted
   */
  protected whenDelete: OnDelete = "unset";

  /**
   * Embed on create
   */
  protected embedOnCreate = "";

  /**
   * Sync mode
   */
  protected syncMode: "single" | "many" = "single";

  /**
   * Query runner using `when` method
   */
  protected queryRunner?: (query: ModelAggregate<Model>) => void;

  /**
   * Define when should the synced model starts to update when any of the given columns is updated in the original model
   */
  protected _updateWhenChange?: string[];

  /**
   * Constructor
   */
  public constructor(
    protected model: typeof Model,
    protected columns: string | string[],
    protected embedMethod = "embedData"
  ) {
    //
  }

  /**
   * Define when should the synced model starts to update when any of the given columns is updated in the original model
   */
  public updateWhenChange(columns: string | string[]) {
    this._updateWhenChange = Array.isArray(columns) ? columns : [columns];

    return this;
  }

  /**
   * Set query runner
   */
  public where(queryRunner: (query: ModelAggregate<Model>) => void) {
    this.queryRunner = queryRunner;

    return this;
  }

  /**
   * Unset on delete
   */
  public unsetOnDelete() {
    this.whenDelete = "unset";

    return this;
  }

  /**
   * Remove on delete
   */
  public removeOnDelete() {
    this.whenDelete = "remove";

    return this;
  }

  /**
   * Embed on create to injected model one the original model is created
   */
  public embedOnCreateFrom(column: string) {
    this.embedOnCreate = column;

    return this;
  }

  /**
   * Mark as many sync
   */
  public syncMany() {
    this.syncMode = "many";

    return this;
  }

  public async sync(
    model: Model,
    saveMode: "create" | "update",
    oldModel?: Model
  ) {
    if (saveMode === "update") {
      return this.syncUpdate(model, oldModel);
    }

    if (!this.embedOnCreate) return;

    const columns = Array.isArray(this.columns) ? this.columns : [this.columns];

    const syncedModel: Model = await (this.model as any).first({
      id: model.get(this.embedOnCreate + ".id"),
    });

    if (!syncedModel) return;

    const modelData =
      typeof (model as any)[this.embedMethod] !== "undefined"
        ? (model as any)[this.embedMethod]()
        : model.data;

    for (const column of columns) {
      if (this.syncMode === "single") {
        syncedModel.set(column, modelData);
      } else {
        syncedModel.associate(column, modelData);
      }
    }

    await syncedModel.save();
  }

  /**
   * Sync update
   */
  public async syncUpdate(model: Model, oldModel?: Model) {
    if (this._updateWhenChange && oldModel) {
      // now check if any of the columns has changed
      // if all of them are the same, then we don't need to update
      if (
        this._updateWhenChange.every((column) =>
          areEqual(model.get(column), oldModel.get(column))
        )
      ) {
        return;
      }
    }

    const columns = Array.isArray(this.columns) ? this.columns : [this.columns];

    const whereOptions: any = {};

    for (const column of columns) {
      whereOptions[column + ".id"] = model.get("id");
    }

    const query = (this.model as any).aggregate().orWhere(whereOptions);

    if (this.queryRunner) {
      this.queryRunner(query);
    }

    const models: Model[] = await query.get();

    const modelData =
      typeof (model as any)[this.embedMethod] !== "undefined"
        ? (model as any)[this.embedMethod]()
        : model.embeddedData;

    for (const currentModel of models) {
      for (const column of columns) {
        if (this.syncMode === "single") {
          currentModel.set(column, modelData);
        } else {
          currentModel.reassociate(column, modelData);
        }
      }

      await currentModel.save();
    }
  }

  /**
   * Sync model destruction
   */
  public async syncDestruction(model: Model) {
    const columns = Array.isArray(this.columns) ? this.columns : [this.columns];

    const query: any = {};

    for (const column of columns) {
      query[column + ".id"] = model.get("id");
    }

    const models: Model[] = await (this.model as any)
      .aggregate()
      .orWhere(query)
      .get();

    for (const currentModel of models) {
      if (this.whenDelete === "unset") {
        for (const column of columns) {
          if (this.syncMode === "single") {
            currentModel.unset(column);
          } else {
            currentModel.disassociate(column, model);
          }
        }

        await currentModel.save();
      } else {
        await currentModel.destroy();
      }
    }
  }
}
