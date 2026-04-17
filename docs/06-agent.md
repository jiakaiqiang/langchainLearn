# 06 Agent

## 这一章学什么

这一章对应 LangChain 官方文档里的 **Agents**。它讲的不是“一个更高级的聊天函数”，而是一个更接近真实 AI 应用运行方式的核心心智模型：**模型不再只负责回答，而是负责在上下文里决定下一步该做什么。**

这就是官方文档反复强调的 agent loop。它通常不是一次性完成，而是一个循环：

1. 理解用户目标
2. 判断是否需要外部能力
3. 调用工具或读取上下文
4. 观察中间结果
5. 再决定下一步
6. 最终组织答案

从应用架构角度看，agent 的价值在于：它把模型从“内容生成器”推进为“任务协调者”。但这也意味着它会带来更高的延迟、更高的成本和更高的不确定性。理解这个 tradeoff，比单纯把 agent 跑通更重要。

## 对应 LangChain 官方文档

- Quickstart
- Agents

官方入口：
- `https://docs.langchain.com/oss/javascript/langchain/quickstart`
- `https://docs.langchain.com/oss/javascript/langchain/agents`

## 本章核心概念

### 1. agent loop

agent 的本质不是某个类名，而是一种运行时循环。最关键的特征是：**下一步动作不是完全写死的，而是由模型根据当前上下文动态决定。**

一个最小 agent loop 通常包括：

- 理解当前问题
- 判断是否需要工具
- 调用工具
- 读取工具结果
- 再决定是否继续
- 输出最终回答

这和 chain 最大的区别就在这里：chain 的步骤通常是确定的，agent 的步骤则带有动态决策。

### 2. Agent 是 tools、memory、retrieval 的编排层

agent 很少是孤立存在的。它通常要和：

- tools
- memory
- retrieval
- streaming
- middleware

一起工作。你可以把 agent 理解成这些能力的调度层。没有这些可用能力，agent 也就很难真正“行动”。

### 3. Agent 不是默认最优解

这是官方文档语境下非常重要的一点。agent 虽然强，但并不是所有问题都该上 agent。

如果你的任务是：

- 明确的单步改写
- 稳定的多步流水线
- 单次结构化提取

那么 chain 或 structured output 往往更便宜、更快、更稳定。

Agent 更适合：

- 是否需要查资料无法提前确定
- 工具调用路径不固定
- 任务是开放式的
- 需要模型边观察边决策

### 4. progress 是 agent UI 的一部分

一旦进入 agent 场景，前端就不只是渲染最终回答，还会关心：

- 当前在做什么
- 是否正在查资料
- 是否正在调用工具
- 有没有中间结果
- 为什么回答还没结束

也就是说，agent 不只是后端执行逻辑，它天然要求更丰富的前端状态呈现。

## 先看本仓库里的代码锚点

这一章对应的本地代码是：

- `src/demos/06-agent/index.ts`
- `src/learn/agents/assistantAgent.ts`

### 为什么先看这段：agent 并不是凭空工作，而是先被组装出可用能力边界

```ts
const agent = createAgent({
  model: createDemoModel(),
  tools: [getApiSpec],
});
```

这段代码处在本章流程的**能力编排层**。`createAgent(...)` 做的不是“创建一个更聪明的模型”，而是把一个可推理的模型和一组可调用工具绑定到同一个运行时里。

它对应的是官方文档里的 **agent assembly / orchestration boundary**：agent 真正特别的地方，不是 API 名字，而是运行时已经具备了“先判断、再行动、再观察”的可能性。

这里刻意简化的是：当前 demo 只有一个工具，没有 memory、retrieval、middleware，也没有更复杂的 system prompt 或 runtime 控制策略。

### 为什么再看这段：tool 在 agent 里提供的是“行动选项”，不是硬编码流程

```ts
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
```

这段代码处在**可行动能力定义层**。从 agent 角度看，这个工具不是一个普通帮助函数，而是一个“必要时可调用的外部能力”。

它对应的是官方语境里的 **tool-enabled agent loop**：模型会根据当前任务判断要不要调用 `get_api_spec`，而不是应用先固定写死“第一步永远查接口文档”。

这里刻意简化的是：当前工具是只读、无副作用、返回也非常短。真实 agent 常会面对多工具选择、副作用控制、失败重试、权限校验和幂等问题。

### 为什么最后看这段：agent 表面还是一次 `invoke()`，内部却可能已经不是单步执行

```ts
const result = await agent.invoke({
  messages: [
    {
      role: "user",
      content: "请帮我理解 /api/login 的作用，并给我 2 条前端接入建议。必要时先查询接口说明。",
    },
  ],
});

console.log(result.messages.at(-1)?.content);
```

这段代码处在**实际运行层**。从调用方看，它很像一次普通请求；但从 agent 内部看，可能已经经历了“理解问题 -> 选择工具 -> 读取结果 -> 生成回答”的循环。

它对应的是官方文档里的 **single invocation, multi-step internal execution**：外层 API 可以很干净，内部执行却不一定是线性的。

这里刻意简化的是：当前 demo 没有把中间 tool call、tool result、progress event 单独输出出来，所以你看到的是简洁结果，而不是完整执行轨迹。

### 为什么补看这段：agent 封装常常只是把模型和工具继续包一层

```ts
export const customAgent = (tools: any[]) => {
  return createAgent({
    model: modelInter,
    tools,
  });
};
```

这段代码来自 `src/learn/agents/assistantAgent.ts`，处在**二次封装层**。它说明很多真实项目不会在每个调用点都直接写 `createAgent(...)`，而是先封装出自己的 agent 工厂。

它对应的是官方语境里的 **application-level agent wrapper**：项目通常会把模型选择、工具集、共享 middleware、默认配置收敛到统一入口。

这里刻意简化的是：当前封装还没有加入统一上下文、观测、权限或流式事件处理，但已经能帮助你看到“agent 也是应用层对象，不只是 demo 代码片段”。

## 关键 API / 运行时形态

### `createAgent(...)`

当前仓库示例使用 `createAgent(...)` 构造 agent，把模型和工具组装起来。这个 API 背后的核心意义不是“如何实例化”，而是：

- 你给 agent 什么模型
- 你给 agent 哪些工具
- 它在运行时如何围绕这些能力形成 loop

### `agent.invoke(...)`

虽然看起来仍然像一次调用，但内部可能已经经历了多轮观察与工具调用。也就是说，外部 API 可能简洁，内部运行却不再是单步。

### 中间事件与最终结果

在更完整的 agent 场景里，除了最终回答，你往往还关心中间事件流。这也是为什么 streaming 在 agent 场景里比普通模型调用更重要。

## 这一章没有展开的能力，其实是什么

### 1. agent loop 不是“模型更聪明了”，而是“运行时更多轮了”

很多人会把 agent 误解成某种特殊大模型能力，但 agent 的关键其实在运行时编排：

- 模型先看当前上下文
- 模型决定下一步动作
- 应用执行动作
- 结果再回到上下文
- 模型继续决定

也就是说，agent 的本质不是更神秘的模型，而是**更复杂的执行闭环**。

### 2. 为什么 agent 比 chain 更贵、更慢

因为 agent 常常包含额外的判断回合和工具调用，所以会带来：

- 更多 token 消耗
- 更长的整体链路
- 更多失败点
- 更高的调试复杂度

这也是为什么官网虽然强调 agents，但不会说“所有任务都应该 agent 化”。

### 3. middleware / runtime / observability 为什么在 agent 里更重要

一旦 agent 真正开始调工具、走多轮流程，你就不再只关心“最后答得好不好”，还会关心：

- 到底调了哪些工具
- 为什么选了这个工具
- 哪一步变慢了
- 哪一步失败了
- 有没有越权调用

这就是为什么更完整的 LangChain 体系会继续展开 middleware、runtime、LangSmith、observability。它们在 agent 场景里不是锦上添花，而是逐渐变成工程必需品。

### 4. agent progress 为什么对前端很关键

普通聊天可以只展示最终文本，但 agent 往往需要用户理解“系统正在工作”。所以前端常常需要展示：

- 当前步骤
- 正在查询什么
- 是否需要等待工具返回
- 是否卡在某一步

这意味着 agent 不只是后端执行模式，也会直接改变前端状态模型。

## 前端接入时要注意什么

### 1. Agent 往往更慢，但用户体感未必更差

因为 agent 可能要多轮思考、多次调用工具，所以总耗时通常比单次模型调用更长。但如果你把进度、工具调用状态、部分结果展示得足够清楚，用户体感反而可能更好。

### 2. 不要把所有需求都包装成 agent

前端团队很容易陷入“只要是 AI，就做成 agent”的冲动。但很多需求其实是：

- 单步 structured output
- 固定 workflow
- 纯 retrieval 问答

这些并不一定需要 agent。滥用 agent 的后果通常是：

- 成本更高
- 调试更难
- 输出更不稳定

### 3. Agent UI 要考虑可解释性

在 agent 场景下，用户更容易问：“它刚刚为什么这么做？” 所以前端常需要设计：

- 调用过哪些工具
- 查了哪些资料
- 当前在哪一步
- 是否允许中断或重试

这和普通聊天气泡完全不同。

### 4. Agent 往往是系统能力整合点

一旦 agent 接入的工具越来越多，它就会变成权限、安全、审计、上下文治理的中心点。前端虽然不一定实现这些底层逻辑，但一定要理解这些约束会反过来影响 UI 设计和交互流程。

## 能力边界与 tradeoff

### Agent 适合什么

- 开放式任务
- 动态工具调用
- 路径不确定的任务执行
- 需要观察中间结果后再决策的流程

### Agent 不适合什么

- 明确的单步任务
- 对稳定性要求极高且流程固定的转换
- 低延迟、低成本优先的场景

### 主要 tradeoff

- Agent：更灵活，但更慢、更贵、更难调试
- Chain / structured output：更可控，但灵活性不足

理解这个边界，才不会把 agent 神化。

## 与下一章的关系

当你理解 agent 可以“临场决定”下一步之后，下一步自然会问：**它能不能记住上下文，或者跨会话记住用户信息？**

这就进入 Memory。因为没有 memory，agent 很多时候只能“聪明地当场回答”；有了 memory，它才开始具备持续性。

## 下一步在官方文档里看什么

建议继续看：

1. Agents 章节里的 invocation 与 advanced concepts
2. agent progress、agent streaming 的相关内容
3. middleware、runtime、observability 为什么在 agent 里更重要
4. 然后进入本仓库下一章 `docs/07-memory.md`，理解 short-term memory 和 long-term memory 为什么必须分开看
