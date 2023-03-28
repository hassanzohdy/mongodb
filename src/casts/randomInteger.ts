import { Random } from "@mongez/reinforcements";

export function randomInteger(min: number, max: number) {
  return () => Random.integer(min, max);
}
