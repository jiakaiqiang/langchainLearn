type Doc = { id: string; content: string };

const memoryStore: Doc[] = [];

export function addToVectorStore(docs: Doc[]) {
  memoryStore.push(...docs);
}

export function getVectorStore() {
  return memoryStore;
}
