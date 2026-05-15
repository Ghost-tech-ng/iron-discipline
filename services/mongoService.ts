const DATA_API_URL = process.env.EXPO_PUBLIC_MONGODB_DATA_API_URL ?? '';
const API_KEY = process.env.EXPO_PUBLIC_MONGODB_API_KEY ?? '';
const DATABASE = process.env.EXPO_PUBLIC_MONGODB_DATABASE ?? 'iron_discipline';
const DATA_SOURCE = process.env.EXPO_PUBLIC_MONGODB_DATA_SOURCE ?? 'Cluster0';

export function isMongoConfigured(): boolean {
  return DATA_API_URL.length > 0 && API_KEY.length > 0;
}

async function callApi(action: string, collection: string, body: object): Promise<unknown> {
  const res = await fetch(`${DATA_API_URL}/action/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': API_KEY,
    },
    body: JSON.stringify({
      dataSource: DATA_SOURCE,
      database: DATABASE,
      collection,
      ...body,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MongoDB ${action} failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function upsertOne(
  collection: string,
  filter: Record<string, unknown>,
  doc: Record<string, unknown>
): Promise<void> {
  await callApi('updateOne', collection, {
    filter,
    update: { $set: doc },
    upsert: true,
  });
}

export async function upsertMany(
  collection: string,
  docs: Record<string, unknown>[],
  idField = 'id'
): Promise<void> {
  await Promise.all(
    docs.map((doc) =>
      upsertOne(collection, { [idField]: doc[idField] }, doc)
    )
  );
}
