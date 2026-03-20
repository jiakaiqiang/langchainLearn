import { runArticleChain } from "../chains/articleChain";

export async function runAssistantAgent(input: string) {
  return runArticleChain(input);
}
