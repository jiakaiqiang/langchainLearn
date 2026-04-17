/**
 * 结构化输出示例
 *
 * 学习目标：
 * - 理解 toolStrategy：让 Agent 按 Zod schema 返回结构化数据
 * - 学习如何定义输出 schema 并挂载到 Agent 的 responseFormat
 * - 掌握从 AgentResult 中获取 structuredResponse 的方法
 *
 * 场景：从自然语言文本中提取用户信息（姓名、年龄、城市），返回类型安全的 JSON 对象。
 */
import { createAgent, toolStrategy } from "langchain";
import * as z from "zod";
import { createDemoModel } from "../../shared/model";

/**
 * 定义用户信息的输出 schema
 * - 使用 Zod 描述数据结构，每个字段带中文描述
 * - .describe("用户信息") 为整个 schema 添加说明，帮助模型理解意图
 */
export const userInfoSchema = z
  .object({
    name: z.string().describe("名字"),
    age: z.number().describe("年龄"),
    city: z.string().describe("城市"),
  })
  .describe("用户信息");

/**
 * 创建结构化输出 Agent
 * - responseFormat 使用 toolStrategy，告诉模型必须按 userInfoSchema 返回数据
 * - toolMessageContent 是工具调用完成后的提示消息
 */
export const createStructuredOutputAgent = () => {
  return createAgent({
    model: createDemoModel(),
    responseFormat: toolStrategy(userInfoSchema, {
      toolMessageContent: "个人信息提取完成",
    }),
  });
};

/**
 * 从文本中提取用户信息
 * - 传入自由文本，Agent 会解析其中的姓名、年龄和城市
 * - 返回值是 typed 的 structuredResponse，可直接访问 name/age/city 字段
 */
export const extractUserInfo = async (text: string) => {
  const agent = createStructuredOutputAgent();
  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content: `请从以下内容中提取姓名、年龄和城市，并按结构化结果返回：${text}`,
      },
    ],
  });

  // structuredResponse 是按 userInfoSchema 解析后的对象
  return result.structuredResponse;
};
