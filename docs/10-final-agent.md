# 10 Final Agent

## 这一章学什么

这一章是整个仓库的 capstone。它不再引入一个全新的单点 API，而是把前面章节分散学习过的能力真正放进同一个应用切片里，帮助你建立一个更接近 LangChain 官方文档整体地图的架构视角。

如果前面几章分别在讲：

- 模型如何接收消息
- prompt 如何控制上下文
- 输出如何结构化
- 工具如何暴露能力
- agent 如何动态决策
- memory 如何保存连续性
- retrieval 如何接入外部知识
- streaming 如何改善前端体验

那么这一章讲的是：**这些能力在一个真实应用里为什么会同时出现，以及它们如何彼此配合。**

也就是说，Final Agent 的意义不只是“做一个更大的 demo”，而是帮助你从“学习单点能力”切换到“理解应用架构”。

## 对应 LangChain 官方文档

- Agents
- Short-term Memory / Long-term Memory
- Retrieval
- Frontend Overview

官方入口：
- `https://docs.langchain.com/oss/javascript/langchain/agents`
- `https://docs.langchain.com/oss/javascript/langchain/short-term-memory`
- `https://docs.langchain.com/oss/javascript/langchain/long-term-memory`
- `https://docs.langchain.com/oss/javascript/langchain/retrieval`
- `https://docs.langchain.com/oss/javascript/langchain/frontend/overview`

## 本章核心概念

### 1. 完整应用不是单次模型调用，而是能力组合

这是整个仓库最想帮助前端开发者建立的最终认知。

一个真实 AI 应用通常不会只有一次 `model.invoke()`。它更可能包含：

- messages：组织上下文
- prompt / context control：控制任务表达
- tools：访问系统能力
- memory：保存线程上下文和用户偏好
- retrieval：接入外部知识
- streaming：向 UI 暴露运行过程
- middleware / runtime：控制执行过程和策略

Final Agent 本质上就是这些能力组合后的最小本地切片。

### 2. agent 是编排中心，但不是全部

在这个 capstone 里，agent 像一个协调者：

- 什么时候查资料
- 什么时候读取用户偏好
- 如何把已知上下文组织成回答

但 agent 自己并不凭空拥有知识和记忆，它只是把 tools、memory、retrieval 等能力编排在一起。所以理解这一章时，不要把 agent 神化成“万能大脑”，而要看到它背后依赖的能力层。

### 3. short-term memory、long-term memory、retrieval 各司其职

这一章很适合帮助你真正把三者分开：

- short-term memory：当前线程还记得什么
- long-term memory：用户长期偏好和持久事实
- retrieval：从外部知识库按需查资料

如果这三者职责不清，系统会很快失控。capstone 的价值之一，就是让你看到它们在同一个应用里可以同时存在，但分工必须明确。

### 4. 架构视角比 API 记忆更重要

到这一章时，真正重要的已经不是记住每个 API 名字，而是能够回答这些问题：

- 用户请求从哪里进入
- 哪些信息在本次线程里流动
- 哪些信息被长期保存
- 哪些知识来自外部检索
- 哪些能力由 tool 提供
- 最终哪些内容要反馈给前端 UI

这才是你之后真正能迁移到业务项目里的认知。

## 先看本仓库里的代码锚点

这一章对应的本地代码是：

- `src/demos/10-final-agent/index.ts`

### 为什么先看这段：capstone 的核心不是某一个工具，而是多种能力被挂进同一个 agent 运行时

```ts
const agent = createAgent({
  model: createDemoModel(),
  tools: [searchDesignDoc, saveUserPreference, getUserPreference],
  checkpointer,
  store,
});
```

这段代码处在本章流程的**总装层**。它把模型、工具、short-term memory、long-term memory 一次性放进同一个 agent 实例里。

它对应的是官方文档里的 **multi-capability agent assembly**：真实应用很少只靠单一能力工作，而是把多个能力源在同一运行时中协同起来。

这里刻意简化的是：当前还没有 middleware、runtime policies、observability、human-in-the-loop 或真正的生产级检索后端。

### 为什么再看这段：retrieval-like lookup 和 long-term memory 在 capstone 里承担的是两类不同职责

```ts
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
```

```ts
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
```

这两段代码分别处在**外部知识访问层**和**长期偏好写入层**。`searchDesignDoc` 更像 retrieval 风格能力，解决“按需查资料”；`saveUserPreference` 更像 long-term memory 能力，解决“保存可复用用户偏好”。

它们对应的是官方语境里经常被并置、但不能混淆的两条线：**knowledge access** 与 **user memory**。

这里刻意简化的是：当前 retrieval 还只是本地对象查找，长期记忆也只是内存存储，没有真实索引、权限控制或持久化后端。

### 为什么还要看这段：short-term memory 通过线程配置把多轮请求串成同一条连续链路

```ts
const config = { configurable: { thread_id: "final-agent-thread" } };

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
```

这段代码处在**线程建立层**。它说明 capstone 不是两次完全独立的调用，而是同一线程里的连续交互。

它对应的是官方文档里的 **thread-scoped continuity**：当前会话如何延续，不是靠“模型自然记得”，而是靠运行时明确传递线程身份。

这里刻意简化的是：当前只有一条固定线程，没有分支会话、并发窗口或历史裁剪策略。

### 为什么最后看这段：最终回答其实是多种能力共同作用后的结果

```ts
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

const preference = await store.get(["user-preferences"], "demo-user");
```

这段代码处在**综合执行层**。从用户角度看只是提了一个问题，但从系统角度看，agent 可能已经结合了线程上下文、长期偏好和设计文档查询结果来组织答案。

它对应的是官方语境里的 **capability composition in one request flow**：最终回答往往不是某一个模块单独完成的，而是多种能力协作后的产物。

这里刻意简化的是：当前 demo 仍然只输出最终结果，没有展示更完整的中间事件、可视化进度或引用来源 UI。

## 关键 API / 运行时形态

### `createAgent(...)` + tools + checkpointer + store

当前 capstone 的运行时核心可以概括为：

- `model`：底层推理能力
- `tools`：应用能力入口
- `checkpointer`：short-term memory
- `store`：long-term memory

这不是随意拼装，而是官方当前主线里非常典型的一种组合方式。

### request/data flow

从运行时上，可以把这一章的请求流理解成：

1. 用户提出问题
2. agent 读取当前线程上下文
3. agent 根据需要调用工具
4. 工具可能查询设计文档或读取 / 写入偏好
5. retrieval-like 资料进入上下文
6. agent 组织最终回答
7. 前端再把结果展示给用户

如果把这条链路画成图，你就会发现：这已经很接近真实应用的数据流了。

### 组合能力之间的依赖关系

这一章最值得看的，是能力之间的关系，而不是单独某个能力：

- 没有 tool，agent 很难访问系统能力
- 没有 memory，agent 很难保持连续性
- 没有 retrieval，agent 很难基于私有知识回答
- 没有 streaming，前端很难把复杂过程解释给用户

## 这一章没有展开的能力，其实是什么

### 1. middleware / runtime control 会在综合 agent 里迅速变重要

当一个应用同时拥有工具、记忆和知识接入后，你很快就会关心：

- 哪些工具可以在什么条件下被调用
- 哪些上下文应该在进入模型前被清洗或裁剪
- 某些用户请求是否需要额外保护或确认
- 如何在执行期插入统一策略

这就是为什么官网会继续强调 middleware 和 runtime。它们在综合 agent 里不是装饰层，而是治理层。

### 2. observability / testing / eval 不是附属品

capstone 把能力拼起来后，系统复杂度会上升。此时你不再只关心“最终答得对不对”，还会关心：

- 到底用了哪些工具
- 读到了哪些上下文
- 检索是否召回了正确资料
- 某次失败是 memory、retrieval 还是 tool 出的问题

所以 LangSmith、评测、日志和可观测性在这一阶段会迅速变得必要。

### 3. HITL、MCP、真实检索后端是向生产化迈进时的自然扩展

当综合 agent 真正进入业务环境后，往往还会继续扩展到：

- human-in-the-loop：高风险动作先让人确认
- MCP：把更多外部系统能力接进统一工具边界
- 更真实的 retriever / vector store：让知识接入更稳定
- durable state：让线程和长期信息真正持久化

所以本章更像官方能力图谱的压缩切面，而不是最终落地模板。

### 4. 为什么这一章要被理解成 architecture slice，而不是 production template

当前 capstone 的目标是让你看见“能力如何协同”，而不是教你照搬成生产架构。它展示的是主干数据流和职责分层，不是完整企业级方案。

理解这一点很重要：你应该从它学到组合方式和边界意识，而不是把其中的简化实现直接当作正式架构。

## 前端接入时要注意什么

### 1. 前端展示的不再只是回答，而是系统状态

到了 capstone 这一步，前端 UI 已经不只是渲染一段文本。真实产品里，往往还要展示：

- 当前是否在检索
- 当前是否在调用工具
- 是否读取到了用户偏好
- 当前线程上下文是否延续
- 最终回答引用了哪些资料

也就是说，AI UI 开始从“聊天框”升级为“运行态可视化界面”。

### 2. 每一种能力都会带来独立状态管理需求

- memory 带来线程和持久状态
- retrieval 带来来源和引用状态
- tools 带来执行中 / 成功 / 失败状态
- streaming 带来 partial response 状态

前端如果没有清晰状态分层，很快就会出现混乱。

### 3. 生产版通常需要更严格的边界治理

capstone 很容易让人误以为“把能力拼起来就完成了”。但产品里你还会很快遇到：

- 工具权限控制
- 用户确认流程
- 长期记忆管理
- 检索质量调优
- 失败重试与回退
- 事件日志和观测

所以这一章更像“架构起点”，而不是“完整落地终点”。

## 能力边界与 tradeoff

### 这种综合 agent 适合什么

- 设计系统助手
- 内部开发助手
- 文档问答 + 偏好记忆类产品
- 需要多能力协作的前端 AI 助手

### 不适合直接照搬的情况

- 极其简单的单步生成任务
- 对延迟极其敏感的场景
- 根本不需要 memory / retrieval / tools 的场景

### 主要 tradeoff

- 能力组合越多，场景覆盖越强，但实现和调试复杂度越高
- 用户体验可以更完整，但状态管理和系统边界也会迅速上升
- 更接近真实应用，但不再是“写一个 prompt 就结束”的轻量任务

## 与官方更完整能力图谱的关系

这一章学完后，你应该能更自然地理解为什么官网后面还会继续展开：

- Middleware：在 agent loop 中插入策略控制
- Context Engineering：更系统地管理 transient / persistent / tool context
- Runtime：执行期上下文与运行环境
- Human-in-the-loop：人工确认与协作分支
- MCP：外部系统能力接入
- LangSmith：测试、调试、观测、评估

因为当一个应用进入综合 agent 阶段，这些能力就不再是“附加项”，而是逐步变成工程必需品。

## 下一步在官方文档里看什么

建议继续把官网这些主题作为本仓库后的进阶方向：

1. Middleware
2. Context Engineering
3. Runtime
4. Frontend Overview 里的 generative UI / branching chat / queues / HITL
5. Retrieval 里的 semantic search / retrievers / agentic RAG
6. Long-term Memory 的更真实存储策略
7. LangSmith / testing / observability / deployment

如果说这 10 章帮你建立的是“LangChain.js 前端开发者基础心智模型”，那么接下来这些主题，才会把你推进到更接近真实 AI Agent 工程的阶段。
