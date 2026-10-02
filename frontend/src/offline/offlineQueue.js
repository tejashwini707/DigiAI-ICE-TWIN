import { openDB } from "idb";

// Robust offline queue with in-memory fallback for mobile private browsing & restricted webviews
const DB_NAME = "antarctica-twin-offline";
const DB_VERSION = 1;
const STORE = "pending_writes";

let memoryQueue = [];
let memoryCounter = 1;
let isIndexedDBAvailable = typeof window !== "undefined" && "indexedDB" in window;

async function getDB() {
  if (!isIndexedDBAvailable) return null;
  try {
    return await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "queueId", autoIncrement: true });
          store.createIndex("createdAt", "createdAt");
        }
      },
    });
  } catch (err) {
    console.warn("IndexedDB access notice (operating in memory queue):", err.message);
    isIndexedDBAvailable = false;
    return null;
  }
}

export async function enqueueWrite(entry) {
  const record = {
    ...entry,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  try {
    const db = await getDB();
    if (db) {
      const queueId = await db.add(STORE, record);
      return { ...record, queueId };
    }
  } catch {
    // fallback to memory
  }

  const queueId = memoryCounter++;
  const memRecord = { ...record, queueId };
  memoryQueue.push(memRecord);
  return memRecord;
}

export async function getQueue() {
  try {
    const db = await getDB();
    if (db) {
      const all = await db.getAll(STORE);
      return all || [];
    }
  } catch {
    // fallback
  }
  return [...memoryQueue];
}

export async function getQueueCount() {
  try {
    const db = await getDB();
    if (db) {
      return await db.count(STORE);
    }
  } catch {
    // fallback
  }
  return memoryQueue.length;
}

export async function removeFromQueue(queueId) {
  if (queueId == null) return;
  try {
    const db = await getDB();
    if (db) {
      const idNum = typeof queueId === "number" ? queueId : isNaN(Number(queueId)) ? queueId : Number(queueId);
      try {
        await db.delete(STORE, idNum);
      } catch {
        await db.delete(STORE, queueId);
      }
      return;
    }
  } catch {
    // fallback
  }
  memoryQueue = memoryQueue.filter((item) => item.queueId !== queueId && item.id !== queueId);
}

export async function removeBatchFromQueue(queueIds) {
  if (!queueIds || queueIds.length === 0) return;
  try {
    const db = await getDB();
    if (db) {
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
      return;
    }
  } catch {
    // fallback
  }
  const idSet = new Set(queueIds);
  memoryQueue = memoryQueue.filter((item) => !idSet.has(item.queueId) && !idSet.has(item.id));
}

export async function bumpAttempts(queueId) {
  if (queueId == null) return;
  try {
    const db = await getDB();
    if (db) {
      const idNum = typeof queueId === "number" ? queueId : isNaN(Number(queueId)) ? queueId : Number(queueId);
      const record = (await db.get(STORE, idNum)) || (await db.get(STORE, queueId));
      if (record) {
        record.attempts = (record.attempts || 0) + 1;
        await db.put(STORE, record);
      }
      return;
    }
  } catch {
    // fallback
  }
  const item = memoryQueue.find((i) => i.queueId === queueId || i.id === queueId);
  if (item) item.attempts = (item.attempts || 0) + 1;
}

export async function clearQueue() {
  try {
    const db = await getDB();
    if (db) {
      await db.clear(STORE);
    }
  } catch {
    // fallback
  }
  memoryQueue = [];
}


