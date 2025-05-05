declare module '@react-native-async-storage/async-storage' {
  export interface AsyncStorageStatic {
    /**
     * Fetches an item for a key and invokes a callback upon completion.
     */
    getItem(key: string, callback?: (error?: Error, result?: string) => void): Promise<string | null>;

    /**
     * Sets the value for a key and invokes a callback upon completion.
     */
    setItem(key: string, value: string, callback?: (error?: Error) => void): Promise<void>;

    /**
     * Removes an item for a key and invokes a callback upon completion.
     */
    removeItem(key: string, callback?: (error?: Error) => void): Promise<void>;

    /**
     * Erases all AsyncStorage for all clients, libraries, etc. You probably don't want to call this.
     * Use removeItem or multiRemove to clear only your app's keys.
     */
    clear(callback?: (error?: Error) => void): Promise<void>;

    /**
     * Gets all keys known to the app, for all callers, libraries, etc.
     */
    getAllKeys(callback?: (error?: Error, keys?: string[]) => void): Promise<string[]>;

    /**
     * multiGet invokes a callback with an array of key-value pair arrays that matches the input format of multiSet.
     */
    multiGet(keys: string[], callback?: (errors?: Error[], result?: [string, string | null][]) => void): Promise<[string, string | null][]>;

    /**
     * multiSet and multiMerge take arrays of key-value array pairs that match the output of multiGet.
     */
    multiSet(keyValuePairs: string[][], callback?: (errors?: Error[]) => void): Promise<void>;

    /**
     * Delete all the keys in the keys array.
     */
    multiRemove(keys: string[], callback?: (errors?: Error[]) => void): Promise<void>;

    /**
     * Merges an existing item value with an input value, assuming both values are stringified JSON.
     */
    mergeItem(key: string, value: string, callback?: (error?: Error) => void): Promise<void>;

    /**
     * Merges multiple existing item values with multiple input values, assuming both values are stringified JSON.
     */
    multiMerge(keyValuePairs: string[][], callback?: (errors?: Error[]) => void): Promise<void>;
  }

  const AsyncStorage: AsyncStorageStatic;
  export default AsyncStorage;
}
