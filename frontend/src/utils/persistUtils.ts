import { indexedDBStorage } from '@/redux/store'

const PROTECTED_KEYS = new Set([
  'persist:user',
  'persist:sidebar',
])

export const wipePersistedStateExceptProtected = async () => {
  const keys = await indexedDBStorage.getAllKeys()

  const keysToRemove = keys.filter(
    (key:string) => key.startsWith('persist:') && !PROTECTED_KEYS.has(key)
  )

  await Promise.all(keysToRemove.map((key:string) => indexedDBStorage.removeItem(key)))
}
