/**
 * 03 Structured Output Demo
 *
 * 学习目标：
 * - 理解 structured output 的核心不是“返回 JSON”，而是“按 schema 返回可验证数据”
 * - 学习复用 src/learn/formatOutput 中的 schema-first 提取逻辑
 * - 理解为什么前端应用通常更适合消费 typed data，而不是自由文本
 */
import { extractUserInfo } from "../../learn/formatOutput/index";
import { printJson, printSection } from "../../shared/console";

export const runStructuredOutputDemo = async () => {
  // 输入一段自然语言，目标是抽取成符合 schema 的结构化结果
  const input = "请提取用户信息：王明，今年 22 岁，现在住在上海。";

  // 返回值已经过 schema 约束，更适合前端直接消费或进入表单/卡片渲染
  const structured = await extractUserInfo(input);

  printSection("03 Structured Output");
  console.log("input:", input);
  printJson("structured", structured);
};
