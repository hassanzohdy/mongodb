import { GenericObject } from "@mongez/reinforcements";
import { Pipeline } from "./pipeline";

export class WherePipeline extends Pipeline {
  /**
   * Constructor
   */
  public constructor(expression: GenericObject) {
    super("match");

    this.data(expression);
  }
}
