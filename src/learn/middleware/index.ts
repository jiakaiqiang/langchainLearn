//结构化输出
import { createAgent  } from "langchain";
import { ChatOllama } from "@langchain/ollama";
import * as z from "zod";

// 创建模型实例
const modelInter = new ChatOllama({
  model: "qwen3.5:cloud",
  temperature: 0,
});
// 创建agent
export const customAgent = (tools: any[]) => {
  return createAgent({
    model: modelInter,

    
  });
}

