import { openDB } from "idb";

// This is the core of the offline-first layer. When the app is "disconnected"
// (either a real network drop, or the simulated toggle used for the demo),
// every write (telemetry, incidents, personnel updates) goes here first
// instead of straight to the API. A background sync loop flushes the queue
// the moment connectivity is confirmed.

const DB_NAME = "antarctica-twin-offline";
const DB_VERSION = 1;
const STORE = "pending_writes";

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "queueId", autoIncrement: true });
        store.createIndex("createdAt", "createdAt");
      }
    },
  });
}

// entry: { type: 'telemetry' | 'incident' | 'personnel' | 'resource',
//          method: 'POST' | 'PATCH', url, body, priority }
export async function enqueueWrite(entry) {
  const db = await getDB();
  const record = {
    ...entry,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  const queueId = await db.add(STORE, record);
  return { ...record, queueId };
}

export async function getQueue() {
  const db = await getDB();
  return db.getAll(STORE);
}

export async function getQueueCount() {
  const db = await getDB();
  return db.count(STORE);
}

export async function removeFromQueue(queueId) {
  if (queueId == null) return;
  const db = await getDB();
  const idNum = typeof queueId === "number" ? queueId : isNaN(Number(queueId)) ? queueId : Number(queueId);
  try {
    await db.delete(STORE, idNum);
  } catch {
    await db.delete(STORE, queueId);
  }
}

export async function removeBatchFromQueue(queueIds) {
  if (!queueIds || queueIds.length === 0) return;
  const db = await getDB();
  const tx = db.transaction(STORE, "readwrite");
  await Promise.all(
    queueIds
      .filter((id) => id != null)
      .map(async (id) => {
        const idNum = typeof id === "number" ? id : isNaN(Number(id)) ? id : Number(id);
        try {
          await tx.store.delete(idNum);
        } catch {
          await tx.store.delete(id);
        }
      })
  );
  await tx.done;
}

export async function bumpAttempts(queueId) {
  if (queueId == null) return;
  const db = await getDB();
  const idNum = typeof queueId === "number" ? queueId : isNaN(Number(queueId)) ? queueId : Number(queueId);
  const record = (await db.get(STORE, idNum)) || (await db.get(STORE, queueId));
  if (!record) return;
  record.attempts = (record.attempts || 0) + 1;
  await db.put(STORE, record);
}

export async function clearQueue() {
  const db = await getDB();
  return db.clear(STORE);
}

