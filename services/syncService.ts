import * as Network from 'expo-network';
import { getDb } from './db';
import { isCloudConfigured, patchDoc } from './firestoreService';

type Doc = Record<string, unknown>;

interface PendingDoc {
  collection: string;
  docId: string;
  hash: string;
  data: Doc;
}

const MAX_PARALLEL_WRITES = 6;

export async function isOnline(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return !!(state.isConnected && state.isInternetReachable);
  } catch {
    return false;
  }
}

/** FNV-1a — only needs to detect that a row changed, not resist collisions on purpose. */
function hashOf(data: Doc): string {
  const str = JSON.stringify(data);
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

async function collectDocs(userId: string): Promise<{ collection: string; docId: string; data: Doc }[]> {
  const db = getDb();
  const [meals, supplements, discipline, checkIns, workouts, exercises, sets, habits, water, profile] =
    await Promise.all([
      db.getAllAsync<Doc>('SELECT * FROM meal_entries;'),
      db.getAllAsync<Doc>('SELECT * FROM supplement_logs;'),
      db.getAllAsync<Doc>('SELECT * FROM discipline_history;'),
      db.getAllAsync<Doc>('SELECT * FROM weekly_checkins;'),
      db.getAllAsync<Doc>('SELECT * FROM workout_logs;'),
      db.getAllAsync<Doc>('SELECT * FROM exercise_logs;'),
      db.getAllAsync<Doc>('SELECT * FROM set_logs;'),
      db.getAllAsync<Doc>('SELECT * FROM habit_logs;'),
      // Water rows have no stable identity, so sync the daily total.
      db.getAllAsync<Doc>('SELECT date, SUM(amount_ml) as total FROM water_logs GROUP BY date;'),
      db.getFirstAsync<Doc>('SELECT * FROM user_profile WHERE id = 1;'),
    ]);

  const docs: { collection: string; docId: string; data: Doc }[] = [];
  const add = (collection: string, rows: Doc[], idOf: (row: Doc) => string) => {
    for (const row of rows) {
      const docId = idOf(row);
      docs.push({ collection, docId, data: { ...row, id: docId, userId } });
    }
  };

  add('meal_entries', meals, (r) => String(r.id));
  add('supplement_logs', supplements, (r) => `${userId}_${r.date}_${r.supplement_id}`);
  add('discipline_history', discipline, (r) => `${userId}_${r.date}`);
  add('weekly_checkins', checkIns, (r) => String(r.id));
  add('workout_logs', workouts, (r) => String(r.id));
  add('exercise_logs', exercises, (r) => `${userId}_${r.id}`);
  add('set_logs', sets, (r) => `${userId}_${r.id}`);
  add('habit_logs', habits, (r) => `${userId}_${r.date}_${r.habit_id}`);
  add('water_logs', water, (r) => `${userId}_${r.date}`);
  if (profile) add('user_profile', [profile], () => `${userId}_profile`);

  return docs;
}

/**
 * One-way backup. Each row's hash is remembered after a successful write, so a
 * sync only uploads rows that are new or changed since the last one.
 */
export async function syncToCloud(userId: string): Promise<void> {
  if (!isCloudConfigured()) throw new Error('Cloud backup not configured — add Firebase credentials to .env.local');

  const db = getDb();
  const docs = await collectDocs(userId);
  const known = await db.getAllAsync<{ collection: string; doc_id: string; hash: string }>(
    'SELECT collection, doc_id, hash FROM sync_state;'
  );
  const lastHash = new Map(known.map((k) => [`${k.collection}/${k.doc_id}`, k.hash]));

  const pending: PendingDoc[] = [];
  for (const d of docs) {
    const hash = hashOf(d.data);
    if (lastHash.get(`${d.collection}/${d.docId}`) !== hash) pending.push({ ...d, hash });
  }

  let failures = 0;
  for (let i = 0; i < pending.length; i += MAX_PARALLEL_WRITES) {
    const batch = pending.slice(i, i + MAX_PARALLEL_WRITES);
    const results = await Promise.allSettled(
      batch.map((p) => patchDoc(p.collection, p.docId, p.data))
    );
    for (let j = 0; j < batch.length; j++) {
      if (results[j].status === 'fulfilled') {
        await db.runAsync(
          `INSERT INTO sync_state (collection, doc_id, hash) VALUES (?, ?, ?)
           ON CONFLICT(collection, doc_id) DO UPDATE SET hash = excluded.hash;`,
          [batch[j].collection, batch[j].docId, batch[j].hash]
        );
      } else {
        failures++;
      }
    }
  }

  if (failures > 0) {
    throw new Error(`${failures} of ${pending.length} records failed to sync — they will retry next time.`);
  }
}
