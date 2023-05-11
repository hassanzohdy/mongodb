import { Model } from "../model";

export function castModel(
  model: typeof Model,
  embeddedKey: string | string[] = "embeddedData",
) {
  return async function injectEmbeddedData(value: any) {
    if (Array.isArray(value)) {
      if (value[0]?.id) {
        return value;
      }

      const records: Model[] = await model
        .aggregate()
        .whereIn(
          "id",
          value.map(value => Number(value.id || value)),
        )
        .get();

      return records.map(record => {
        if (Array.isArray(embeddedKey)) {
          return record.only(embeddedKey);
        }

        return (record as any)[embeddedKey];
      });
    }

    if (value?.id) return value;

    const record: any =
      value instanceof Model ? value : await model.find(Number(value));

    if (!record) return null;

    if (Array.isArray(embeddedKey)) {
      return record.only(embeddedKey);
    }

    return record[embeddedKey];
  };
}
