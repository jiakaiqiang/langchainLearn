/**
 * 01 Models + Messages Demo
 *
 * 学习目标：
 * - 理解当前 LangChain 官方文档里的基础入口是 models + messages
 * - 学习使用 SystemMessage + HumanMessage 组织一次 message-based 调用
 * - 了解 invoke() 是最基础的同步调用方式，后续可衔接 stream()
 */
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createDemoModel } from "../../shared/model";
import { printSection } from "../../shared/console";

export const runLlmDemo = async () => {
  // 创建 Ollama 模型实例；本仓库里的所有 demo 都统一走共享模型工厂
  const model = createDemoModel();

  // 通过 messages 调用模型：system 负责行为约束，human 负责当前用户输入
  const response = await model.invoke([
    new SystemMessage("你是一个帮助前端工程师快速理解技术概念的助手。"),
    new HumanMessage("请用 3 句话解释什么是 LangChain.js，并说明它对前端开发有什么价值。"),
  ]);

  // 输出结果
  printSection("01 LLM 基础");
  console.log("model:", process.env.OLLAMA_MODEL ?? "qwen3.5:cloud");
  console.log("output:", String(response.content));
};
