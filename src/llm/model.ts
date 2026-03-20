import { ChatOpenAI } from "@langchain/openai";

export function createModel() {
  return new ChatOpenAI({
    model: "gpt-4.1-mini",
    temperature: 0,
    apiKey: process.env.OPENAI_API_KEY,
  });
}
