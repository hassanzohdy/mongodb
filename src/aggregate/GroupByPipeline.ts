import { GenericObject, ltrim } from "@mongez/reinforcements";
import { Pipeline } from "./pipeline";

export class GroupByPipeline extends Pipeline {
  /**
   * Constructor
   */
  public constructor(
    protected readonly _id: string | null | GenericObject,
    protected groupByData: GenericObject = {}
  ) {
    super("group");

    if (typeof _id === "string") {
      _id = "$" + ltrim(_id, "$");
    }

    this.data({
      _id: _id,
      ...this.groupByData,
    });
  }
}

export function groupBy(
  column: string | null | GenericObject,
  groupByData: Record<string, any>
) {
  return new GroupByPipeline(column, groupByData);
}
