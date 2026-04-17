/**
 * 06 Agent Demo
 *
 * 学习目标：
 * - 理解 agent loop：理解问题 → 决定是否调用工具 → 观察结果 → 组织回答
 * - 学习 Agent 为什么是当前 LangChain 官方文档的主线能力之一
 * - 掌握工具如何把“模型推理”连接到“应用可执行能力”
 */
import { tool } from "langchain";
import { createAgent } from "langchain";
import * as z from "zod";
import { createDemoModel } from "../../shared/model";
import { printSection } from "../../shared/console";

// 定义一个带 schema 的工具；它是 Agent 可被授予的受控能力
const getApiSpec = tool(
  async ({ route }) => {
    const specs: Record<string, string> = {
      "/api/login": "POST /api/login：用于用户名密码登录，返回 token 和用户基础信息。",
      "/api/profile": "GET /api/profile：获取当前用户资料，需要携带 token。",
    };

    return specs[route] ?? `${route} 暂无接口说明。`;
  },
  {
    name: "get_api_spec",
    description: "获取接口说明",
    schema: z.object({
      route: z.string().describe("接口路径，例如 /api/login"),
    }),
  }
);

export const runAgentDemo = async () => {
  // 创建 Agent：让模型拥有“何时用工具、何时直接回答”的自主决策能力
  const agent = createAgent({
    model: createDemoModel(),
    tools: [getApiSpec],
  });

  // 用户问题里显式允许“必要时先查询接口说明”，Agent 会自行决定是否走工具分支
  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content: "请帮我理解 /api/login 的作用，并给我 2 条前端接入建议。必要时先查询接口说明。",
      },
    ],
  });

  printSection("06 Agent");
  console.log("output:", result.messages.at(-1)?.content);
};
