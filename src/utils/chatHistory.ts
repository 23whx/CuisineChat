/**
 * 本机聊天记录存储（IndexedDB）。
 *
 * - 只有用户在设置中开启「保留聊天记录」时才写入；保留时长 1–27 小时
 * - 每条记录保存时写入 expiresAt = savedAt + 保留时长，到期由 purgeExpired() 删除
 * - 记录按「房间号 + 密码」的哈希分组，房间号和密码本身不会以明文保存
 * - 使用 IndexedDB 而不是 localStorage：附件以 base64 保存，单个可达 20 MB，超出 localStorage 容量
 */
import type { Message } from '@/types';
import { hashString } from './hash';

export const HISTORY_MIN_HOURS = 1;
export const HISTORY_MAX_HOURS = 27;
const HOUR = 60 * 60 * 1000;

const DB_NAME = 'cuisine-chat-history';
const DB_VERSION = 1;
const STORE = 'messages';

interface StoredMessage {
  pk: string; // `${roomKey}:${message.id}`
  roomKey: string;
  savedAt: number;
  expiresAt: number;
  message: Message;
}

export const clampHours = (hours: number) =>
  Math.min(HISTORY_MAX_HOURS, Math.max(HISTORY_MIN_HOURS, Math.round(hours)));

/** 房间的存储键：同一房间号换了密码即视为不同房间 */
export const getRoomKey = (roomId: string, password: string) => {
  const key = `${roomId}\u0000${password}`;
  return `${hashString(key, 7)}${hashString(key, 8)}`;
};

let dbPromise: Promise<IDBDatabase> | null = null;

const openDb = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB 不可用'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'pk' });
        store.createIndex('roomKey', 'roomKey');
        store.createIndex('expiresAt', 'expiresAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB 被其他标签页占用'));
  });
  // 打开失败（隐私模式、被禁用）时允许下次重试
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
};

/** 在一个事务里执行操作，事务完成后 resolve */
const run = async <T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore, done: (value: T) => void) => void
): Promise<T> => {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    let result: T;
    work(tx.objectStore(STORE), (value) => {
      result = value;
    });
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('事务已中止'));
  });
};

/** 保存消息（同一条消息重复保存会整条覆盖，到期时间从本次保存起算） */
export const saveMessages = (roomKey: string, messages: Message[], hours: number) => {
  if (messages.length === 0) return Promise.resolve();
  const now = Date.now();
  const ttl = clampHours(hours) * HOUR;
  return run<void>('readwrite', (store) => {
    for (const message of messages) {
      const record: StoredMessage = {
        pk: `${roomKey}:${message.id}`,
        roomKey,
        savedAt: now,
        expiresAt: now + ttl,
        message,
      };
      store.put(record);
    }
  });
};

/** 读取某房间未过期的消息，按时间排序 */
export const loadMessages = (roomKey: string): Promise<Message[]> => {
  const now = Date.now();
  return run<Message[]>('readonly', (store, done) => {
    const req = store.index('roomKey').getAll(IDBKeyRange.only(roomKey));
    req.onsuccess = () => {
      const records = (req.result as StoredMessage[]).filter((r) => r.expiresAt > now);
      done(records.map((r) => r.message).sort((a, b) => a.timestamp - b.timestamp));
    };
  });
};

/** 删除所有已过期的记录，返回删除数量 */
export const purgeExpired = (): Promise<number> =>
  run<number>('readwrite', (store, done) => {
    let count = 0;
    const req = store.index('expiresAt').openCursor(IDBKeyRange.upperBound(Date.now()));
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) {
        done(count);
        return;
      }
      cursor.delete();
      count++;
      cursor.continue();
    };
  });

/** 修改保留时长后，按新时长重新计算所有记录的到期时间（从各自的保存时间起算） */
export const updateRetention = (hours: number) => {
  const ttl = clampHours(hours) * HOUR;
  return run<void>('readwrite', (store) => {
    const req = store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return;
      const record = cursor.value as StoredMessage;
      cursor.update({ ...record, expiresAt: record.savedAt + ttl });
      cursor.continue();
    };
  }).then(() => purgeExpired().then(() => undefined));
};

/** 删除本机保存的全部聊天记录 */
export const clearAllHistory = () => run<void>('readwrite', (store) => store.clear());

/**
 * 应用运行期间定期清理过期记录。
 * 浏览器关闭时网页无法执行代码，所以关闭期间到期的记录会在下次打开网站时删除。
 */
export const startHistoryJanitor = (intervalMs = 60 * 1000) => {
  const tick = () => {
    purgeExpired().catch(() => {
      // IndexedDB 不可用时静默跳过
    });
  };
  tick();
  const timer = window.setInterval(tick, intervalMs);
  return () => window.clearInterval(timer);
};
