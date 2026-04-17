import { ChatOllama } from "@langchain/ollama";

export function createModel() {
  return new ChatOllama({
    model: process.env.OLLAMA_MODEL ?? "qwen3.5:cloud",
    temperature: 0,
    think: false,
  });
}
