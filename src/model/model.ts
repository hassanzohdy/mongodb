import {
  areEqual,
  except,
  get,
  merge,
  only,
  set,
} from "@mongez/reinforcements";
import Is from "@mongez/supportive-is";
import { fromUTC, now, toUTC } from "@mongez/time-wizard";
import dayjs from "dayjs";
import { ObjectId } from "mongodb";
import { queryBuilder } from "../query-builder/query-builder";
import { RelationshipModel } from "./relationships";
import {
  CastType,
  Casts,
  CustomCastType,
  CustomCasts,
  Document,
  ModelDocument,
} from "./types";

type Schema = ModelDocument;

export class Model extends RelationshipModel {
  /**
   * Model Initial Document data
   */
  public initialData: Partial<Schema> = {};

  /**
   * Model Document data
   */
  public data!: Schema;

  /**
   * Determine whether to move document to trash or not before deleting it permanently
   *
   * @default true
   */
  public moveToTrash = true;

  /**
   * Items per page
   */
  public perPage = 15;

  /**
   * If set to true, then only the original data and the data in the casts property will be saved
   * If set to false, all data will be saved
   */
  public isStrict = true;

  /**
   * Define Default value data that will be merged with the models' data
   * on the create process
   */
  public defaultValue: Partial<Schema> = {};

  /**
   * A flag to determine if the model is being restored
   */
  protected isRestored = false;

  /**
   * Model casts types
   */
  protected casts: Casts = {};

  /**
   * Set custom casts that will be used to cast the model's data are not related to the current value of the collection's column
   *
   * For example: `name` is not a column in the given data, but it will be concatenation of `firstName` and `lastName`
   */
  protected customCasts: CustomCasts = {};

  /**
   * Guarded fields
   */
  public guarded: string[] = [];

  /**
   * Fillable fields
   */
  public filled: string[] = [];

  /**
   * Embedded columns
   */
  public embedded: string[] = [];

  /**
   * Embed all columns except the given columns
   */
  public embedAllExcept: string[] = [];

  /**
   * Embed all columns except timestamps and created|updated|deleted by columns
   */
  public embedAllExceptTimestampsAndUserColumns = false;

  /**
   * Created at column
   */
  public createdAtColumn = "createdAt";

  /**
   * Updated at column
   */
  public updatedAtColumn = "updatedAt";

  /**
   * Deleted at column
   */
  public deletedAtColumn = "deletedAt";

  /**
   * Created by column
   */
  public createdByColumn = "createdBy";

  /**
   * Updated by column
   */
  public updatedByColumn = "updatedBy";

  /**
   * Deleted by column
   */
  public deletedByColumn = "deletedBy";

  /**
   * Date format
   */
  public dateFormat = "DD-MM-YYYY";

  /**
   * Current request object
   */
  public request?: any;

  /**
   * Constructor
   */
  public constructor(public originalData: Schema | Model = {} as Schema) {
    //
    super();

    if (this.originalData instanceof Model) {
      this.originalData = { ...this.originalData.data };
    }

    this.originalData = this.castDates(this.originalData);

    if (typeof this.originalData._id === "string") {
      try {
        this.originalData._id = new ObjectId(this.originalData._id);
      } catch (error) {
        //
      }
    }

    this.data = { ...this.originalData };

    this.initialData = { ...this.originalData };
  }

  /**
   * Set the current request object
   */
  public setRequest(request: any) {
    this.request = request;

    return this;
  }

  /**
   * Get save columns which are the casts keys
   */
  public get castColumns() {
    return Object.keys(this.casts);
  }

  /**
   * Cast dates
   */
  protected castDates(data: Schema) {
    const dates = [
      this.createdAtColumn,
      this.updatedAtColumn,
      this.deletedAtColumn,
    ];

    for (const column in this.casts) {
      if (this.casts[column] === "date") {
        dates.push(column);
      }
    }

    const newData: Partial<Schema> = { ...data };

    dates.forEach(dateColumn => {
      const date: Date | undefined = get(newData, dateColumn);

      if (date) {
        set(newData, dateColumn, fromUTC(date));
      }
    });

    return newData as Schema;
  }

  /**
   * Get value from original data
   */
  public original(key: string, defaultValue?: any) {
    return get(this.originalData, key, defaultValue);
  }

  /**
   * Get all data except the guarded fields
   */
  public get publicData() {
    return except(this.data, this.guarded);
  }

  /**
   * Get guarded data
   */
  public get guardedData() {
    return only(this.data, this.guarded);
  }

  /**
   * Get the model's id
   */
  public get id(): number {
    return this.get("id");
  }

  /**
   * Get mongodb id
   */
  public get _id(): ObjectId {
    return this.get("_id");
  }

  /**
   * Mark the current model as being restored
   */
  public markAsRestored() {
    this.isRestored = true;
  }

  /**
   * Set a column in the model data
   */
  public set(column: keyof Schema, value: any) {
    this.data = set(this.data, column as string, value) as Schema;

    return this;
  }

  /**
   * Increment the given column by the given value
   */
  public increment(column: keyof Schema, value = 1) {
    return this.set(column, this.get(column, 0) + value);
  }

  /**
   * Decrement the given column by the given value
   */
  public decrement(column: keyof Schema, value = 1) {
    return this.set(column, this.get(column, 0) - value);
  }

  /**
   * Get value of the given column
   */
  public get(column: keyof Schema, defaultValue?: any) {
    return get(this.data, column as string, defaultValue);
  }

  /**
   * Determine whether the given column exists in the document
   */
  public has(column: keyof Schema) {
    return get(this.data, column as string) !== undefined;
  }

  /**
   * Get all columns except the given ones
   */
  public except(columns: (keyof Schema)[]): Document {
    return except(this.data, columns as string[]);
  }

  /**
   * Get only the given columns
   */
  public only(columns: (keyof Schema)[]): Document {
    return only(this.data, columns as string[]);
  }

  /**
   * Unset or remove the given columns from the data
   */
  public unset(...columns: (keyof Schema)[]) {
    this.data = except(this.data, columns as string[]);

    return this;
  }

  /**
   * Replace the entire document data with the given new data
   */
  public replaceWith(data: Schema) {
    if (!data.id && this.data.id) {
      data.id = this.data.id;
    }

    if (!data._id && this.data._id) {
      data._id = this.data._id;
    }

    this.data = data;

    return this;
  }

  /**
   * Merge the given documents to current document
   */
  public merge(data: Document) {
    this.data = merge(this.data, data);

    return this;
  }

  /**
   * Perform saving operation either by updating or creating a new record in database
   */
  public async save(
    mergedData?: Omit<Schema, "id" | "_id">,
    {
      triggerEvents,
    }: {
      triggerEvents?: boolean;
    } = {
      triggerEvents: true,
    },
  ) {
    try {
      if (mergedData) {
        this.merge(mergedData);
      }

      let mode: "create" | "update" = "create";

      let currentModel;

      // check if the data contains the primary id column
      if (!this.isNewModel()) {
        // perform an update operation
        // check if the data has changed
        // if not changed, then do not do anything

        if (this.shouldUpdate(this.originalData, this.data) === false)
          return this;

        currentModel = this.clone();

        mode = "update";

        const updatedAtColumn = this.updatedAtColumn;

        if (updatedAtColumn) {
          // updateAtColumn is supposed to be part of the Schema
          (this.data as any)[updatedAtColumn] = new Date();
        }

        await this.castData();

        if (triggerEvents) {
          const selfModelEvents = this.getModelEvents();

          const ModelEvents = this.getBaseModelEvents();

          await this.onSaving();
          await this.onUpdating();
          await selfModelEvents.trigger("updating", this);
          await selfModelEvents.trigger("saving", this, currentModel);
          await ModelEvents.trigger("updating", this);
          await ModelEvents.trigger("saving", this, currentModel);
        }

        await queryBuilder.replace(
          this.getCollection(),
          {
            _id: this.data._id,
          },
          this.data,
        );

        if (triggerEvents) {
          const selfModelEvents = this.getModelEvents();
          const ModelEvents = this.getBaseModelEvents();
          this.onSaved();
          this.onUpdated();
          selfModelEvents.trigger("updated", this, currentModel);
          selfModelEvents.trigger("saved", this, currentModel);
          ModelEvents.trigger("updated", this), currentModel;
          ModelEvents.trigger("saved", this, currentModel);
        }
      } else {
        // creating a new document in the database
        const generateNextId =
          this.getStaticProperty("generateNextId").bind(Model);

        // check for default values and merge it with the data
        this.checkDefaultValues();

        // if the column does not exist, then create it
        if (!this.data.id) {
          this.data.id = await generateNextId();
        }

        const now = new Date();

        const createdAtColumn = this.createdAtColumn;

        const createdAtValue = this.get(createdAtColumn, now);

        // if the column does not exist, then create it
        if (createdAtValue) {
          this.data[createdAtColumn as keyof Schema] = createdAtValue;
        }

        // if the column does not exist, then create it
        const updatedAtColumn = this.updatedAtColumn;

        const updatedAtValue = this.get(updatedAtColumn, now);

        if (updatedAtValue) {
          this.data[updatedAtColumn as keyof Schema] = updatedAtValue;
        }

        await this.castData();

        if (triggerEvents) {
          const selfModelEvents = this.getModelEvents();

          const ModelEvents = this.getBaseModelEvents();

          await this.onSaving();
          await this.onCreating();
          await selfModelEvents.trigger("creating", this);
          await selfModelEvents.trigger("saving", this);
          await ModelEvents.trigger("creating", this);
          await ModelEvents.trigger("saving", this);
        }

        this.data = (await queryBuilder.create(
          this.getCollection(),
          this.data,
        )) as Schema;

        if (triggerEvents) {
          const selfModelEvents = this.getModelEvents();
          const ModelEvents = this.getBaseModelEvents();
          this.onSaved();
          this.onCreated();
          selfModelEvents.trigger("created", this);
          selfModelEvents.trigger("saved", this);
          ModelEvents.trigger("created", this);
          ModelEvents.trigger("saved", this);
        }
      }

      this.originalData = { ...this.data };

      this.startSyncing(mode, currentModel);

      return this;
    } catch (error) {
      console.log("Error in " + this.constructor.name + ".save()");
      console.log(error);
      throw error;
    }
  }

  /**
   * Perform saving but without any events triggers
   */
  public async silentSaving(mergedData?: Omit<Schema, "id" | "_id">) {
    return await this.save(mergedData, {
      triggerEvents: false,
    });
  }

  /**
   * Determine whether the model should be updated or not
   */
  protected shouldUpdate(originalData: Schema, data: Schema) {
    return areEqual(originalData, data) === false;
  }

  /**
   * Triggered before saving the model either by creating or updating
   */
  protected async onSaving() {
    //
  }

  /**
   * Triggered after saving the model either by creating or updating
   */
  protected async onSaved() {
    //
  }

  /**
   * Triggered before creating the model
   */
  protected async onCreating() {
    //
  }

  /**
   * Triggered after creating the model
   */
  protected async onCreated() {
    //
  }

  /**
   * Triggered before updating the model
   */
  protected async onUpdating() {
    //
  }

  /**
   * Triggered after updating the model
   */
  protected async onUpdated() {
    //
  }

  /**
   * Cast data before saving
   */
  protected async castData() {
    for (const column in this.casts) {
      if (!this.isDirty(column)) {
        continue;
      }

      let value = this.get(column);

      const castType = this.casts[column];

      const castValue = async (value: any) => {
        // if cast type is passed as model class, then get its embedded data
        if (value instanceof Model) {
          value = value.embeddedData;
        } else if (typeof castType === "function") {
          value = await (castType as CustomCastType)(value, column, this);
        } else {
          value = this.castValue(value, castType);
        }

        return value;
      };

      if (Array.isArray(castType)) {
        value = await castType[0](value, column, this);
      } else if (Array.isArray(value) && castType !== "localized") {
        // if cast type is array, then we'll keep the value as it is
        if (castType !== "array") {
          value = await Promise.all(
            value.map(async item => await castValue(item)),
          );
        }
      } else {
        value = await castValue(value);
      }

      this.set(column, value);
    }

    for (const column in this.customCasts) {
      const castType = this.customCasts[column];

      this.set(column, await castType(this, column));
    }
  }

  /**
   * Cast the given value based on the given cast type
   */
  protected castValue(value: any, castType: CastType) {
    const isEmpty = Is.empty(value);
    switch (castType) {
      case "string":
        return isEmpty ? "" : String(value).trim();
      case "localized":
        if (isEmpty) return [];

        if (!Array.isArray(value)) return [];

        return value.map(item => {
          return {
            localeCode: item.localeCode,
            value: item.value,
          };
        });
      case "number":
        return isEmpty ? 0 : Number(value);
      case "int":
      case "integer":
        return isEmpty ? 0 : parseInt(value);
      case "float":
        return isEmpty ? 0 : parseFloat(value);
      case "bool":
      case "boolean": {
        if (isEmpty) return false;

        if (value === "true") return true;

        if (value === "false" || value === "0" || value === 0) return false;

        return Boolean(value);
      }
      case "date": {
        if (value instanceof Date) {
          return toUTC(value);
        }

        if (dayjs.isDayjs(value)) {
          return toUTC(value.toDate());
        }

        if (isEmpty) return null;

        if (typeof value === "string") {
          return toUTC(dayjs(value, this.dateFormat).toDate());
        }

        // timestamp
        if (typeof value === "number") {
          return toUTC(new Date(value));
        }

        return now();
      }
      case "location": {
        if (isEmpty) return null;

        return {
          type: "Point",
          coordinates: [Number(value[0]), Number(value[1])],
        };
      }
      case "object": {
        if (isEmpty) return {};

        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch (error) {
            return {};
          }
        }

        return value;
      }
      case "array": {
        if (isEmpty) return [];

        if (typeof value === "string") {
          return JSON.parse(value);
        }

        return value;
      }
      case "mixed":
      case "any":
      default:
        return value;
    }
  }

  /**
   * Check for default values
   */
  protected checkDefaultValues() {
    // if default value is empty, then do nothing
    if (Is.empty(this.defaultValue)) return;

    // merge the data with default value
    this.data = merge(this.defaultValue, this.data);
  }

  /**
   * Destroy the model and delete it from database collection
   */
  public async destroy() {
    if (!this.data._id) return;

    if (this.deletedAtColumn) {
      (this.data as any)[this.deletedAtColumn] = new Date();
    }

    if (this.moveToTrash) {
      queryBuilder.create(this.getCollection() + "Trash", {
        document: this.data,
      });
    }

    const selfModelEvents = this.getModelEvents();

    const ModelEvents = this.getBaseModelEvents();

    await selfModelEvents.trigger("deleting", this);
    await ModelEvents.trigger("deleting", this);

    await queryBuilder.deleteOne(this.getCollection(), {
      _id: this.data._id,
    });

    await selfModelEvents.trigger("deleted", this);
    await ModelEvents.trigger("deleted", this);

    this.syncDestruction();
  }

  /**
   * Determine if the given column is dirty column
   *
   * Dirty columns are columns that their values have been changed from the original data
   */
  public isDirty(column: string) {
    if (this.isNewModel()) return true;

    const currentValue = get(this.data, column);
    const originalValue = get(this.originalData, column);

    return areEqual(currentValue, originalValue) === false;
  }

  /**
   * Check if current model is a new model
   */
  public isNewModel() {
    return !this.data._id || (this.data._id && this.isRestored);
  }

  /**
   * Get embedded data
   */
  public get embeddedData() {
    if (this.embedAllExcept.length > 0) {
      return except(this.data, this.embedAllExcept);
    }

    if (this.embedAllExceptTimestampsAndUserColumns) {
      return except(this.data, [
        this.createdAtColumn,
        this.updatedAtColumn,
        this.deletedAtColumn,
        this.createdByColumn,
        this.updatedByColumn,
        this.deletedByColumn,
      ]);
    }

    return this.embedded.length > 0 ? this.only(this.embedded) : this.data;
  }

  /**
   * Clone the model
   */
  public clone() {
    return new (this.constructor as any)({ ...this.data });
  }
}

export type ModelType = typeof Model;
