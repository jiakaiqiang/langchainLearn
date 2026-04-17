# AI Agent Learning

一个面向前端开发者的 LangChain.js 学习仓库。

这个仓库以 **LangChain JavaScript 官方文档** 为主线来组织内容，但不会试图直接复制官网，而是把官网里的核心概念压缩成一套更容易上手的中文学习路径。你可以把它理解为：**LangChain.js 官方文档的中文 companion repo**。

这里有两个明确设计目标：

1. **代码保持最小化**：每章只保留帮助理解概念的最小 demo。
2. **文档刻意写得更重**：不仅解释 demo 做了什么，还解释官方概念、运行时形态、边界、tradeoff、前端接入方式，以及当前 demo 故意省略了什么。

所以这个仓库不是“读完就不用看官网”的替代品，而是帮助前端开发者更快建立 LangChain.js 官方心智模型的本地练习场。

官方文档入口：
- `https://docs.langchain.com/oss/javascript/langchain`

## 这个仓库的定位

LangChain 在当前官方文档里的主线，已经不再只是“写 Prompt + 拼 Chain”，而更接近下面这条路径：

- **Models / Messages**：理解模型调用和消息组织
- **Prompt / Context Control**：理解 prompt 是上下文工程的一部分
- **Structured Output**：优先获取应用可消费的结构化结果
- **Tools**：把系统能力暴露给模型调用
- **Agents**：让模型在上下文和工具之间做动态决策
- **Memory**：分清 short-term memory 与 long-term memory
- **Retrieval**：按需接入外部知识
- **Streaming**：把运行过程持续反馈给前端 UI
- **Middleware / Context Engineering / Runtime**：进入更真实的应用控制层

这个仓库虽然保留了 Prompt、Chain 等经典章节，但整体叙事会尽量跟着官网的新心智模型走，而不是停留在旧的“prompt engineering 教程”框架里。

## 如何阅读这个仓库

最推荐的学习方式不是只看代码，也不是只看文档，而是把 **demo、章节文档、官网页面** 一起看。

### 第一步：先运行章节 demo

每一章的主线示例都放在 `src/demos/` 下。你先运行 demo，建立最直接的运行感觉：输入是什么、输出是什么、这一章到底在解决什么问题。

例如：

- `src/demos/01-llm/index.ts`：最基础的 model + messages 调用
- `src/demos/05-tools/index.ts`：模型如何决定调用工具
- `src/demos/10-final-agent/index.ts`：多能力组合后的 capstone

### 第二步：再读对应章节文档

`docs/` 下的每一章文档，不只是概念笔记，也不是单纯的 API 抄录。它们会同时做三件事：

1. 解释这一章在 LangChain 官方文档主线中的位置
2. 穿插当前仓库对应 demo 的代码说明，帮助你把概念绑回真实实现
3. 把“本地 demo 故意简化掉的能力”展开说明，让你知道真实能力层长什么样

也就是说，阅读每章时，最好把 **章节 markdown 和对应 `src/demos/<chapter>/index.ts` 文件一起打开**。

### 第三步：最后跳到官网对应页面

本仓库的目标不是替代官网，而是帮助你先建立一套更稳定的中文心智模型。等你理解本地 demo 和章节讲解后，再去看官网，会更容易分辨：

- 哪些是核心能力
- 哪些是更完整的 runtime / middleware / frontend 模式
- 哪些是当前本地 demo 刻意没展开的部分

也就是说，这个仓库的最佳用法是：

**本地最小 demo -> 中文章节说明 + 本地代码 walkthrough -> 官方文档深入阅读**

## `src/demos/` 和 `src/learn/` 的分工

这两个目录都很重要，但角色不同。

### `src/demos/`

这是当前学习路径的主线代码。每章一个独立 demo，尽量保持最小可运行，用来帮助你先建立一层稳定认知。

### `src/learn/`

这是补充参考区。里面放的是更零散的实验代码，用来帮助解释某些更完整的 LangChain 能力层，例如：

- `src/learn/formatOutput/`：结构化输出的 schema-first 用法
- `src/learn/middleware/`：更靠近 middleware / runtime 的实验
- `src/learn/agents/`：更接近 agent 运行态的额外参考

阅读建议是：**先以 `src/demos/` 为主线，再把 `src/learn/` 当作扩展说明来对照。**

## 运行方式

先安装依赖：

```bash
pnpm install
```

查看可运行 demo：

```bash
pnpm dev
```

运行某个章节 demo：

```bash
pnpm dev llm
pnpm dev prompt
pnpm dev structured
pnpm dev chain
pnpm dev tools
pnpm dev agent
pnpm dev memory
pnpm dev rag
pnpm dev streaming
pnpm dev final
```

构建项目：

```bash
pnpm build
```

运行编译产物：

```bash
pnpm start llm
```

## 模型说明

仓库统一使用 Ollama：

- `OLLAMA_MODEL=qwen3.5:cloud`

所有 demo 都通过 `src/shared/model.ts` 创建模型实例。这样做是为了把学习重点放在 LangChain.js 的应用层能力，而不是 provider 切换和平台差异上。

## 当前学习路径

### 01 Models / Messages
- 代码：`src/demos/01-llm/index.ts`
- 文档：`docs/01-llm.md`
- 官网对应：Overview / Models / Messages
- 学习重点：理解 message-based model invocation、统一模型抽象、`invoke` / `stream` / `batch` 这些基本运行时形态

### 02 Prompt / Context Control
- 代码：`src/demos/02-prompt/index.ts`
- 文档：`docs/02-prompt.md`
- 官网对应：Messages / Context Engineering / System Prompt
- 学习重点：理解 Prompt 是上下文工程的一部分，而不是 LangChain 的全部

### 03 Structured Output
- 代码：`src/demos/03-structured-output/index.ts`
- 文档：`docs/03-structured-output.md`
- 官网对应：Structured Output
- 学习重点：建立 schema-first 心智模型，让 AI 结果直接进入 UI、表单和状态管理

### 04 Chain / Runnable
- 代码：`src/demos/04-chain/index.ts`
- 文档：`docs/04-chain.md`
- 官网对应：Runnable / 组合思路
- 学习重点：理解多步骤确定性组合，以及 chain 和 agent 的边界

### 05 Tools
- 代码：`src/demos/05-tools/index.ts`
- 文档：`docs/05-tools.md`
- 官网对应：Tools
- 学习重点：理解 tool 是模型可调用的受控应用能力，而不只是“一个函数”

### 06 Agents
- 代码：`src/demos/06-agent/index.ts`
- 文档：`docs/06-agent.md`
- 官网对应：Quickstart / Agents
- 学习重点：理解 agent loop、动态决策、latency / cost / reliability tradeoff

### 07 Memory
- 代码：`src/demos/07-memory/index.ts`
- 文档：`docs/07-memory.md`
- 官网对应：Short-term Memory / Long-term Memory
- 学习重点：理解线程上下文、持久用户偏好、记忆写入策略和 memory / retrieval 的边界

### 08 Retrieval / RAG Basics
- 代码：`src/demos/08-rag/index.ts`
- 文档：`docs/08-rag.md`
- 官网对应：Retrieval / RAG
- 学习重点：理解 ingestion -> retrieval -> generation 的基本数据流，以及 retrieval 作为独立知识接入层的意义

### 09 Streaming
- 代码：`src/demos/09-streaming/index.ts`
- 文档：`docs/09-streaming.md`
- 官网对应：Streaming / Frontend Overview
- 学习重点：理解 token streaming、event streaming、感知延迟、前端 partial rendering 和状态管理

### 10 Final Agent
- 代码：`src/demos/10-final-agent/index.ts`
- 文档：`docs/10-final-agent.md`
- 官网对应：Agents / Memory / Retrieval / Frontend Overview
- 学习重点：从单点能力切换到应用架构视角，理解多能力组合后的完整运行流

## 本仓库和官网的关系

### 官网是完整能力图谱
官网会继续展开很多这里没有完整实现的能力，例如：

- middleware
- runtime
- context engineering
- frontend patterns
- human-in-the-loop
- MCP
- long-term memory storage strategies
- retrieval architectures
- observability / testing / deployment / LangSmith

### 本仓库是压缩后的学习路径
本仓库的设计原则是：

- **代码尽量小**，让你快速跑通
- **文档尽量重**，让你真正理解能力边界
- **每章都会把本地 demo 锚回具体代码**，避免停留在抽象概念层
- **会解释当前 demo 没有完整展开的能力层**，避免把教学版实现误以为生产方案
- **尽量从前端视角解释**，帮助你把这些能力映射回真实 UI / 状态 / 交互问题

## 一个很重要的心智模型变化

### 旧的学习顺序常常是

- 写 Prompt
- 拼 Chain
- 输出一段文本

### LangChain 官方文档现在更接近下面这条主线

- 准备 **messages / context**
- 尽量获得 **structured output**
- 通过 **tools** 接系统能力
- 让 **agent** 决定调用路径
- 用 **memory** 保存上下文和用户信息
- 用 **retrieval** 接外部知识
- 用 **streaming** 改善前端体验
- 用 **middleware / runtime / context engineering** 做真实应用控制

这个仓库想帮助你建立的，正是这条更新后的学习主线。

## 官网映射表

| 本仓库章节 | 仓库文档 | 官方文档重点 |
|---|---|---|
| 01 | `docs/01-llm.md` | Overview / Models / Messages |
| 02 | `docs/02-prompt.md` | Messages / Context Engineering / System Prompt |
| 03 | `docs/03-structured-output.md` | Structured Output |
| 04 | `docs/04-chain.md` | Runnable / 组合思路 |
| 05 | `docs/05-tools.md` | Tools |
| 06 | `docs/06-agent.md` | Quickstart / Agents |
| 07 | `docs/07-memory.md` | Short-term Memory / Long-term Memory |
| 08 | `docs/08-rag.md` | Retrieval / RAG |
| 09 | `docs/09-streaming.md` | Streaming / Frontend Overview |
| 10 | `docs/10-final-agent.md` | Agents / Retrieval / Memory / Frontend |

## 进阶阅读建议

跑完这 10 个 demo 后，建议继续看官网这些主题：

- Middleware：如何在 agent loop 中插入控制逻辑
- Context Engineering：如何更系统地管理 transient / persistent / tool context
- Frontend Overview：如何把 LangChain 接进真实前端 UI
- Runtime：运行期上下文和执行环境
- Human-in-the-loop：人工确认、分支对话、审批流程
- MCP：让 agent 接更多外部系统
- Retrieval：向量库、retriever、semantic search、agentic RAG
- Long-term Memory：更真实的持久化存储方案
- LangSmith：测试、观测、调试、评估、部署前验证

## 当前目录结构

- `src/demos/`：按章节拆分的主线 demo 代码
- `src/shared/`：共享模型和少量公共输出逻辑
- `src/learn/`：补充说明更完整能力层的实验代码
- `docs/`：与 demo 一一对应的中文 companion 文档

如果你是第一次学习，建议严格按 `01 -> 10` 的顺序运行，再对照官网继续深入。这样最容易把“最小可运行示例”和“官方完整能力图谱”连接起来。
