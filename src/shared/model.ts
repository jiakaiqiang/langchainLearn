/**
 * 共享模型工厂
 *
 * 统一的模型创建入口，仓库内所有 demo 默认只使用 Ollama。
 * 这样可以让教程里的模型配置保持一致，避免把注意力分散到模型切换上。
 */
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOllama } from "@langchain/ollama";
import "dotenv/config";

/**
 * 创建教学 demo 使用的 ChatModel
 * - 默认模型为 qwen3.5:cloud
 * - 可通过 OLLAMA_MODEL 覆盖
 * - temperature=0 保证输出更稳定，适合教学演示
 */
export const createDemoModel = (): BaseChatModel => {
  return new ChatOllama({
    model: process.env.OLLAMA_MODEL ?? "qwen3.5:cloud",
    temperature: 0,
    think: false,
  });
};
