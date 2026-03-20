import { createModel } from "../llm/model";
import { assistantPrompt } from "../prompts/assistantPrompt";

type ChainResult = { content: string };

function isTimeoutError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes("timed out");
}

export async function runArticleChain(topic: string): Promise<ChainResult> {
  const model = createModel();

  try {
    const resp = await model.invoke(
      `${assistantPrompt}\n请写一段关于「${topic}」的简要介绍。`
    );
    return { content: String(resp.content) };
  } catch (error) {
    if (isTimeoutError(error)) {
      return {
        content: `[MOCK] 当前网络请求超时，已降级输出：${topic} 是一个用于演示 LLM、Chain、Agent、RAG 与工具调用的学习主题。`,
      };
    }
    throw error;
  }
}
