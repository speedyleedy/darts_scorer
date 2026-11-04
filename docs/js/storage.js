/**
 * IndexedDB helpers. Visits and the unsynced queue live in the browser database, not localStorage.
 */

const tx = (names, fn) =>
  DB
    ? new Promise((res, rej) => {
        const t = DB.transaction(names, 'readwrite');
        fn(...names.map((n) => t.objectStore(n)));
        t.oncomplete = res;
        t.onerror = t.onabort = () => rej(t.error);
      })
    : Promise.resolve();

const idbAll = (n) =>
  new Promise((res, rej) => {
    const r = DB.transaction(n).objectStore(n).getAll();
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });

const store = (names, fn) =>
  tx(names, fn).catch(() =>
    warn(
      'Could not save to this browser (the disk may be full). Press Sync now so your visits are copied to your Sheet.',
    ),
  );
