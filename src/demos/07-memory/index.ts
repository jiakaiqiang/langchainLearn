/**
 * 07 Memory Demo
 *
 * 学习目标：
 * - 理解 short-term memory 与 long-term memory 是两类不同问题
 * - 学习使用 MemorySaver 表示线程内上下文，用 InMemoryStore 表示跨会话持久化
 * - 掌握如何在多轮对话中保存和读取用户偏好
 */
import { createAgent, tool } from "langchain";
import { MemorySaver, InMemoryStore } from "@langchain/langgraph";
import * as z from "zod";
import { createDemoModel } from "../../shared/model";
import { printJson, printSection } from "../../shared/console";

// short-term memory：保存同一线程里的消息和中间状态
const checkpointer = new MemorySaver();
// long-term memory：保存跨线程、跨轮次仍然需要读取的用户偏好
const store = new InMemoryStore();

// 保存用户偏好的工具
const savePreference = tool(
  async ({ userId, favoriteComponent }) => {
    await store.put(["preferences"], userId, { favoriteComponent });
    return `已记录用户 ${userId} 偏好的组件：${favoriteComponent}`;
  },
  {
    name: "save_preference",
    description: "保存用户偏好的前端组件",
    schema: z.object({
      userId: z.string(),
      favoriteComponent: z.string(),
    }),
  }
);

// 读取用户偏好的工具
const getPreference = tool(
  async ({ userId }) => {
    return store.get(["preferences"], userId);
  },
  {
    name: "get_preference",
    description: "读取用户偏好的前端组件",
    schema: z.object({ userId: z.string() }),
  }
);

export const runMemoryDemo = async () => {
  // 创建带记忆能力的 Agent
  const agent = createAgent({
    model: createDemoModel(),
    tools: [savePreference, getPreference],
    checkpointer,
    store,
  });

  // 配置线程 ID，用于短期记忆关联
  const config = { configurable: { thread_id: "memory-demo-thread" } };

  // 第一轮：保存偏好
  await agent.invoke(
    {
      messages: [
        {
          role: "user",
          content: "记住：用户 u1 最喜欢的组件是 Table。",
        },
      ],
    },
    config
  );

  // 第二轮：查询刚才保存的偏好
  const secondTurn = await agent.invoke(
    {
      messages: [
        {
          role: "user",
          content: "请告诉我刚才记录的用户 u1 偏好，并说明这体现了什么记忆能力。",
        },
      ],
    },
    config
  );

  // 直接从 store 验证
  const stored = await store.get(["preferences"], "u1");

  printSection("07 Memory");
  printJson("stored", stored);
  console.log("output:", secondTurn.messages.at(-1)?.content);
};
