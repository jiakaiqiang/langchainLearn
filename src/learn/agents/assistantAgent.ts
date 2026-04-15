import { createAgent } from "langchain";
import { ChatOllama } from "@langchain/ollama";

//中间件- 创建模型切换中间件







// 创建模型实例
const modelInter = new ChatOllama({
  model: "qwen3.5:cloud",
  temperature: 0,
  think: false, // 开启思考模式
});


export const customAgent = (tools: any[]) => {
    return createAgent({
        model: modelInter,
        tools
    });
};