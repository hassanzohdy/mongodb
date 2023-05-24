import Is from "@mongez/supportive-is";
import { toUTC } from "@mongez/time-wizard";
import { Filter } from "../model";
import { MongoDBOperator, WhereOperator } from "./types";

export class WhereExpression {
  /**
   * Operators list
   */
  public static readonly operators: Record<WhereOperator, MongoDBOperator> = {
    "=": "$eq",
    "!=": "$ne",
    not: "$ne",
    ">": "$gt",
    ">=": "$gte",
    "<": "$lt",
    "<=": "$lte",
    in: "$in",
    nin: "$nin",
    notIn: "$nin",
    all: "$all",
    exists: "$exists",
    type: "$type",
    mod: "$mod",
    regex: "$regex",
    between: "$between",
    notBetween: "$between",
    geoIntersects: "$geoIntersects",
    geoWithin: "$geoWithin",
    near: "$near",
    nearSphere: "$nearSphere",
    elemMatch: "$elemMatch",
    size: "$size",
    like: "$regex",
    notLike: "$regex",
    startsWith: "$regex",
    endsWith: "$regex",
  };

  /**
   * Where query
   */
  public static parse(column: string, value: any): Filter;
  public static parse(filter: Filter): Filter;
  public static parse(
    column: string,
    operator: WhereOperator,
    value: any,
  ): Filter;
  public static parse(...args: any[]) {
    if (args.length === 1 && Is.plainObject(args[0])) return args[0];

    // eslint-disable-next-line prefer-const
    const column: string = args[0];
    let operator: WhereOperator = args[1];
    let value: any = args[2];

    // if the length is two, then the operator will be =
    if (args.length === 2) {
      value = operator;
      operator = "=";
    }

    if (operator === "like") {
      // escape the value special characters
      value = String(value).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      value = new RegExp(value, "i");
    } else if (operator === "notLike") {
      // escape the value special characters
      value = value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      value = new RegExp(value, "i");
      operator = "not";
      value = {
        $regex: value,
      };
    } else if (operator === "startsWith") {
      // escape the value special characters
      value = value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      value = new RegExp(`^${value}`, "i");
    } else if (operator === "endsWith") {
      // escape the value special characters
      value = value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      value = new RegExp(`${value}$`, "i");
    }

    let expression = {
      [WhereExpression.operators[operator as WhereOperator]]: value,
    };

    if (value instanceof Date) {
      value = toUTC(value);
    } else if (Array.isArray(value)) {
      value = value.map(item => {
        if (item instanceof Date) {
          return toUTC(item);
        }

        return item;
      });
    }

    if (operator === "between") {
      expression = {
        $gte: value[0],
        $lte: value[1],
      };
    } else if (operator === "notBetween") {
      expression = {
        $not: {
          $gte: value[0],
          $lte: value[1],
        },
      };
    }

    // now add the data
    return {
      [column]: expression,
    };
  }
}

export const toOperator = (operator: WhereOperator) => {
  return WhereExpression.operators[operator];
};
