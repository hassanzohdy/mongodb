import { Pipeline } from "./pipeline";

export class LimitPipeline extends Pipeline {
  /**
   * Constructor
   */
  public constructor(protected readonly limit: number) {
    super("limit");

    this.data(limit);
  }
}

export function limitPipeline(limit: number) {
  return new LimitPipeline(limit);
}
