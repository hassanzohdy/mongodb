import { ltrim } from "@mongez/reinforcements";
import { Pipeline } from "./pipeline";

export class UnwindPipeline extends Pipeline {
  /**
   * Constructor
   */
  public constructor(
    protected readonly column: string,
    protected readonly preserveNullAndEmptyArrays: boolean = false
  ) {
    super("unwind");

    this.data({
      path: "$" + ltrim(column, "$"),
      preserveNullAndEmptyArrays: preserveNullAndEmptyArrays,
    });
  }
}
