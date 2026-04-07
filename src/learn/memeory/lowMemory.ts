//短期记忆
import { createAgent } from "langchain";
import { ChatOllama } from "@langchain/ollama";
import {MemorySaver} from "@langchain/langgraph";

// 创建模型实例
const modelInter = new ChatOllama({
  model: "qwen3.5:cloud",
  temperature: 0,
});

// 创建记忆保存器
const checkpointer  = new MemorySaver();


// 创建agent
export const customAgent = (tools: any[]) => {
  return createAgent({
    model: modelInter,
    tools,
    checkpointer , // 配置记忆保存器
  });
}
