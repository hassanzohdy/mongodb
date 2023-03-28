import { WherePipeline } from "./WherePipeline";

export class OrWherePipeline extends WherePipeline {
  /**
   * {@inheritDoc}
   */
  public parse() {
    const data: {
      [key: string]: any;
    }[] = [];

    for (const column in this.pipelineData) {
      data.push({
        [column]: this.pipelineData[column],
      });
    }

    return {
      $match: {
        $or: data,
      },
    };
  }
}
