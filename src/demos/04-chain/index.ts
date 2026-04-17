/**
 * 04 Chain / Runnable Demo
 *
 * 学习目标：
 * - 理解多步骤链式处理：先生成提纲，再润色
 * - 掌握 Runnable 的 pipe 组合模式
 * - 学习如何将一个链的输出作为另一个链的输入
 */
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createDemoModel } from "../../shared/model";
import { printSection } from "../../shared/console";

export const runChainDemo = async () => {
  // 第一步：生成分享提纲
  const outlinePrompt = PromptTemplate.fromTemplate(
    "请为主题 \"{topic}\" 生成 3 条适合前端团队分享的提纲。"
  );

  // 第二步：润色为开场白
  const polishPrompt = PromptTemplate.fromTemplate(
    [
      "你会收到一个提纲，请把它改写成更适合分享会开场的版本。",
      "提纲：{outline}",
      "输出要求：保留 3 条编号列表，每条 1 句话。",
    ].join("\n")
  );

  // 构建两条链
  const outlineChain = outlinePrompt.pipe(createDemoModel()).pipe(new StringOutputParser());
  const polishChain = polishPrompt.pipe(createDemoModel()).pipe(new StringOutputParser());

  // 串行执行：先生成提纲，再润色
  const outline = await outlineChain.invoke({ topic: "在前端项目中引入 LangChain.js" });
  const finalText = await polishChain.invoke({ outline });

  printSection("04 Chain / Runnable");
  console.log("outline:", outline);
  console.log("final:", finalText);
};
