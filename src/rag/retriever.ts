import { getVectorStore } from "./vectorStore";

export function retrieveTopK(query: string, k = 3) {
  const docs = getVectorStore();
  return docs.filter((d) => d.content.includes(query)).slice(0, k);
}
