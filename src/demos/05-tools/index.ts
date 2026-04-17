/**
 * 05 Tools Demo
 *
 * 学习目标：
 * - 理解 Tool 的概念：将前端能力封装为模型可调用的函数
 * - 学习使用 tool() 包装器 + Zod schema 定义工具
 * - 掌握 Agent 如何在对话中决定调用工具
 */
import { tool } from "langchain";
import * as z from "zod";
import { createAgent } from "langchain";
import { createDemoModel } from "../../shared/model";
import { printSection } from "../../shared/console";

// 定义查询组件文档的工具
const getComponentDoc = tool(
  async ({ component }) => {
    // 模拟组件文档数据库
    const docs: Record<string, string> = {
      Table: "Table 组件适合展示分页数据，常见能力包括 columns、rowKey 和 loading。",
      Modal: "Modal 组件适合承载确认、编辑和详情查看流程，注意控制打开状态和关闭回调。",
      Form: "Form 组件适合处理受控输入、校验规则和提交动作。",
    };

    return docs[component] ?? `${component} 组件暂无示例文档，请先补充设计系统说明。`;
  },
  {
    name: "get_component_doc",
    description: "查询前端组件的简要文档说明",
    schema: z.object({
      component: z.string().describe("组件名称，例如 Table、Modal、Form"),
    }),
  }
);

export const runToolsDemo = async () => {
  // 创建带工具的 Agent
  const agent = createAgent({
    model: createDemoModel(),
    tools: [getComponentDoc],
  });

  // 用户提问需要查询组件文档
  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content: "请先查询 Table 的组件说明，再告诉我它适合什么场景。",
      },
    ],
  });

  printSection("05 Tools");
  console.log("output:", result.messages.at(-1)?.content);
};
