import { toStudlyCase } from "@mongez/reinforcements";
import { Aggregate } from "../aggregate";
import { select } from "../aggregate/SelectPipeline";
import { PaginationListing } from "./types";

export default class ModelAggregate<T> extends Aggregate {
  /**
   * Constructor
   */
  public constructor(protected readonly model: any) {
    super(model.collection);
    this.database = model.database;
  }

  /**
   * {@inheritDoc}
   */
  public async get(
    mapData: (record: any) => any = (record) => new this.model(record)
  ) {
    return (await super.get(mapData)) as T[];
  }

  /**
   * {@inheritDoc}
   */
  public async first() {
    return (await super.first()) as T | null;
  }

  /**
   * {@inheritDoc}
   */
  public async last() {
    return (await super.last()) as T | null;
  }

  /**
   * {@inheritDoc}
   */
  public async paginate<G = T>(
    page = 1,
    limit = this.model.perPage
  ): Promise<PaginationListing<G>> {
    return await super.paginate<G>(page, limit);
  }

  /**
   * Delete records
   */
  public async delete() {
    const records = await this.select(["id", "_id"]).get();

    records.forEach(async (model: any) => {
      await model.destroy();
    });

    return records.length;
  }

  /**
   * Join the given alias
   */
  public with(alias: string, ...moreParams: any[]) {
    const method = `with${toStudlyCase(alias)}`;

    const relation = this.model[method];

    if (!relation) {
      throw new Error(`Relation ${alias} not found`);
    }

    const {
      model,
      localField,
      as,
      foreignField,
      single = false,
      select: selectColumns,
      pipeline = [],
    } = relation.call(this.model, ...moreParams);

    if (selectColumns) {
      pipeline.push(select(selectColumns));
    }

    this.lookup({
      as,
      single,
      from: model.collection,
      // related to from field
      foreignField: foreignField || `${as}.id`,
      // related to current model
      localField: localField || "id",
      pipeline,
    });

    return this;
  }
}