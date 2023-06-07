import { $agg } from "./expressions";
import { Pipeline } from "./pipeline";

export type UnwindOptions = {
  preserveNullAndEmptyArrays?: boolean;
  includeArrayIndex?: string;
};

export class UnwindPipeline extends Pipeline {
  /**
   * Constructor
   */
  public constructor(
    protected readonly column: string,
    options: UnwindOptions = {},
  ) {
    super("unwind");

    const { preserveNullAndEmptyArrays = false, includeArrayIndex = "" } =
      options;

    this.data({
      path: $agg.columnName(column),
      preserveNullAndEmptyArrays,
      includeArrayIndex,
    });
  }
}

export function unwindPipeline(column: string, options?: UnwindOptions) {
  return new UnwindPipeline(column, options);
}
