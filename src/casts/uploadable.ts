import { Upload } from "app/uploads/models";

async function getUpload(hash: string) {
  return (await Upload.findBy("hash", hash))?.embeddedData;
}

/**
 * Casts a value to an uploadable object.
 * If the value is an array, it will return an array of uploadable objects.
 */
export async function uploadable(hash: any) {
  if (Array.isArray(hash)) {
    const uploads: any[] = [];

    for (const hashValue of hash) {
      uploads.push(await getUpload(hashValue));
    }

    return uploads;
  }

  return await getUpload(hash);
}
