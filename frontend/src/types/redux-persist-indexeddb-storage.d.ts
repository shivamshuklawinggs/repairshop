declare module 'redux-persist-indexeddb-storage' {
  const createIndexedDBStorage: (dbName: string) => any;
  export default createIndexedDBStorage;
} 