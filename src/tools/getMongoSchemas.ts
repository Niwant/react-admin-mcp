import { MongoClient } from "mongodb";

export async function getMongoSchemas() {
  const uri = process.env.MONGO_URI!;
  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db();
  const collections = await db.listCollections().toArray();

  const schemaInfo = [];

  for (const coll of collections) {
    const sample = await db.collection(coll.name).findOne();
    if (sample) {
      schemaInfo.push({
        name: coll.name,
        fields: Object.fromEntries(
          Object.entries(sample).map(([k, v]) => [k, typeof v])
        ),
      });
    }
  }

  await client.close();
  return { collections: schemaInfo };
}
