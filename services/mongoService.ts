// Cloud sync via Firebase Firestore REST API
// (Same exports as before so nothing else needs to change)

const PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '';
const API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

export function isMongoConfigured(): boolean {
  return PROJECT_ID.length > 0 && API_KEY.length > 0;
}

type FSPrimitive =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null };

function toFSValue(v: unknown): FSPrimitive {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  return { stringValue: String(v) };
}

function toFSDoc(obj: Record<string, unknown>): { fields: Record<string, FSPrimitive> } {
  const fields: Record<string, FSPrimitive> = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toFSValue(v);
  }
  return { fields };
}

async function patchDoc(collection: string, docId: string, data: Record<string, unknown>): Promise<void> {
  const safeId = encodeURIComponent(String(docId).replace(/\//g, '_'));
  const url = `${BASE_URL}/${collection}/${safeId}?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toFSDoc(data)),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore write failed (${res.status}): ${text}`);
  }
}

export async function upsertOne(
  collection: string,
  filter: Record<string, unknown>,
  doc: Record<string, unknown>
): Promise<void> {
  const id = String(filter.id ?? filter._id ?? JSON.stringify(filter));
  await patchDoc(collection, id, doc);
}

export async function upsertMany(
  collection: string,
  docs: Record<string, unknown>[],
  idField = 'id'
): Promise<void> {
  await Promise.all(
    docs.map((doc) => patchDoc(collection, String(doc[idField]), doc))
  );
}
