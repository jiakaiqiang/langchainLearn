/**
 * 02 Prompt 工程 Demo
 *
 * 学习目标：
 * - 使用 PromptTemplate 创建可复用的提示模板
 * - 理解模板变量替换机制
 * - 掌握链式调用：prompt -> model -> parser
 */
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createDemoModel } from "../../shared/model";
import { printSection } from "../../shared/console";

export const runPromptDemo = async () => {
  // 定义带变量的提示模板
  const prompt = PromptTemplate.fromTemplate(
    [
      "你是一名前端架构顾问。",
      "请把下面的需求整理成 3 条可执行建议。",
      "需求：{requirement}",
      "输出要求：每条建议必须简洁，并说明对前端项目的直接价值。",
    ].join("\n")
  );

  // 构建链：模板 -> 模型 -> 字符串解析器
  const chain = prompt.pipe(createDemoModel()).pipe(new StringOutputParser());

  // 注入变量并执行
  const result = await chain.invoke({
    requirement: "我们要在后台管理系统里接入 AI 助手，希望先做一个稳定、可控、易演示的 MVP。",
  });

  printSection("02 Prompt 工程");
  console.log("output:", result);
};
