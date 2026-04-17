/**
 * 10 Final Agent Demo — 课程综合实验
 *
 * 学习目标：
 * - 将官方主线里的多个核心能力压缩到一个前端导向的 capstone 里
 * - 理解 tools、short-term memory、long-term memory、retrieval 如何在 Agent 中协同
 * - 建立“完整应用不是单点 API，而是多个能力组合”的整体认识
 *
 * 这个 Agent 综合了：
 * 1. Tools：searchDesignDoc 查询外部知识
 * 2. Long-term memory：saveUserPreference / getUserPreference 读写用户偏好
 * 3. Short-term memory：MemorySaver 保持同一线程内的对话上下文
 * 4. Retrieval：通过工具模拟从设计系统文档中获取相关资料
 */
import { createAgent, tool } from "langchain";
import { MemorySaver, InMemoryStore } from "@langchain/langgraph";
import * as z from "zod";
import { createDemoModel } from "../../shared/model";
import { printJson, printSection } from "../../shared/console";

// long-term memory 存储：跨线程保存用户偏好
const store = new InMemoryStore();
// short-term memory 检查点：线程内保留对话状态
const checkpointer = new MemorySaver();

/**
 * 工具 1：查询设计系统文档
 * 用工具来承载 retrieval 入口；真实项目中可替换为向量检索、检索 API 或 agentic RAG
 */
const searchDesignDoc = tool(
  async ({ keyword }) => {
    const docs: Record<string, string> = {
      table: "Table 文档强调列表展示、分页、排序与 loading。",
      modal: "Modal 文档强调弹层开关、确认操作与表单承载。",
      form: "Form 文档强调字段校验、提交状态和错误提示。",
    };

    return docs[keyword.toLowerCase()] ?? `${keyword} 暂无设计系统文档。`;
  },
  {
    name: "search_design_doc",
    description: "查询设计系统文档",
    schema: z.object({ keyword: z.string() }),
  }
);

/**
 * 工具 2：保存用户偏好到长期记忆
 * 将用户的回答风格偏好写入 InMemoryStore，供后续轮次使用
 */
const saveUserPreference = tool(
  async ({ userId, style }) => {
    await store.put(["user-preferences"], userId, { style });
    return `已记录 ${userId} 偏好的回答风格：${style}`;
  },
  {
    name: "save_user_preference",
    description: "保存用户偏好",
    schema: z.object({ userId: z.string(), style: z.string() }),
  }
);

/**
 * 工具 3：读取用户偏好
 * 从长期记忆中获取之前保存的用户偏好，辅助个性化回答
 */
const getUserPreference = tool(
  async ({ userId }) => {
    return store.get(["user-preferences"], userId);
  },
  {
    name: "get_user_preference",
    description: "获取用户偏好",
    schema: z.object({ userId: z.string() }),
  }
);

export const runFinalAgentDemo = async () => {
  // 创建综合能力 Agent：把 model、tools、short-term memory、long-term memory 组合在一起
  const agent = createAgent({
    model: createDemoModel(),
    tools: [searchDesignDoc, saveUserPreference, getUserPreference],
    checkpointer, // short-term memory：线程内上下文
    store,        // long-term memory：跨线程持久化
  });

  // 配置 thread_id；同一线程里的多轮对话才能共享 short-term memory
  const config = { configurable: { thread_id: "final-agent-thread" } };

  // 第一轮：先写入 long-term memory
  await agent.invoke(
    {
      messages: [
        {
          role: "user",
          content: "记住：用户 demo-user 希望回答风格更偏向前端实战。",
        },
      ],
    },
    config
  );

  // 第二轮：触发 retrieval + preference read + answer synthesis
  // Agent 会自行决定哪些步骤要通过工具完成
  const result = await agent.invoke(
    {
      messages: [
        {
          role: "user",
          content: "请先查询 Table 的设计系统文档，再结合我的偏好，告诉我为什么它适合后台列表页。",
        },
      ],
    },
    config
  );

  // 直接从 store 验证长期记忆写入成功
  const preference = await store.get(["user-preferences"], "demo-user");

  printSection("10 Final Agent");
  printJson("preference", preference);
  console.log("output:", result.messages.at(-1)?.content);
};
