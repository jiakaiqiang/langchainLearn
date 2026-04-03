import { createAgent } from "langchain";
import { ChatOllama } from "@langchain/ollama";


// 创建模型实例
const modelInter = new ChatOllama({
  model: "qwen3.5:cloud",
  temperature: 0,
});


export const customAgent = (tools: any[]) => {
    return createAgent({
        model: modelInter,
        tools
    });
};