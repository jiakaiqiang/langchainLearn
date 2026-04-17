# 01 Models / Messages

## 这一章学什么

这一章对应 LangChain 官方文档里的 **Overview / Models / Messages**。它解决的是一个最基础但非常重要的问题：**在 LangChain.js 里，一次模型调用到底长什么样，运行时真正流动的对象又是什么。**

很多旧教程会把 AI 调用写成“给模型一段字符串，然后拿回一段字符串”。这种理解并不完全错，但它会很快失效，因为真实应用里你往往不只需要一段输入文本，而是需要把不同来源的上下文拆开管理：

- 系统规则是什么
- 用户当前问了什么
- 历史消息有哪些
- 工具执行结果是什么
- 哪些内容应该进入模型上下文，哪些不应该

所以在 LangChain 的新叙事里，更推荐你先建立 **message-based model invocation** 的心智模型：应用不是简单把一段大字符串塞给模型，而是把不同职责的消息组织好，再交给 model 执行。

对前端开发者来说，这是后面所有章节的基础。因为 structured output、tools、agents、memory、retrieval、streaming，本质上都还是围绕“模型如何接收上下文、如何返回结果”展开。

## 对应 LangChain 官方文档

- Overview
- Models
- Messages

官方入口：
- `https://docs.langchain.com/oss/javascript/langchain/overview`
- `https://docs.langchain.com/oss/javascript/langchain/models`

## 本章核心概念

### 1. Model / ChatModel

在官方文档的语境里，`model` 是对底层大模型能力的统一抽象。不同模型提供商的 SDK、参数名、返回格式并不一致，而 LangChain 会尽量把这些差异收敛成更统一的调用形态。

在 JavaScript 应用里，你最常接触的是 `ChatModel`。它强调的不是“输入一段 prompt 文本”，而是“输入一组 messages”。这比传统字符串调用更适合真实应用，因为：

- system、user、assistant、tool 等消息职责不同
- 多轮对话天然就是消息序列
- 你可以更清楚地控制上下文边界
- 工具调用、记忆、检索结果都更容易插入消息流

### 2. Messages

`messages` 是模型调用的实际输入载体。你可以把它理解为一个有顺序的上下文数组。

典型角色包括：

- `SystemMessage`：定义行为边界、角色、输出要求
- `HumanMessage`：代表用户当前输入
- `AIMessage`：代表模型先前输出
- `ToolMessage`：代表工具返回给模型的结果

前端初学者最容易犯的错误，是把所有内容拼成一个超长字符串。这虽然能跑，但一旦应用变复杂，就会开始失去可维护性。

### 3. LangChain 的统一价值

LangChain 的一个重要价值，不是“替你发请求”这么简单，而是把不同模型提供商的调用方式、消息结构、工具能力、流式接口，收敛到更稳定的应用层接口上。这样你在构建上层 AI 功能时，可以更多关注运行时编排，而不是被 provider 差异拖住。

## 先看本仓库里的代码锚点

这一章对应的本地代码是：

- `src/shared/model.ts`
- `src/demos/01-llm/index.ts`

### 为什么先看这段：仓库怎样统一创建模型

先看共享模型工厂，因为它解释了为什么本仓库所有 demo 都能保持同一种调用形态。

```ts
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOllama } from "@langchain/ollama";
import "dotenv/config";

export const createDemoModel = (): BaseChatModel => {
  return new ChatOllama({
    model: process.env.OLLAMA_MODEL ?? "qwen3.5:cloud",
    temperature: 0,
    think: false,
  });
};
```

这段代码在本章流程里处于**最底层模型入口**。后面所有 demo 都不再直接写 provider 细节，而是统一通过 `createDemoModel()` 获取一个 `BaseChatModel`。

它对应的是官方文档里的 **model abstraction**：上层应用更关心“这里有一个可调用的 chat model”，而不是每次都从头处理 provider SDK 差异。

这里刻意简化的地方是：本仓库没有展开多 provider 路由、容错、回退策略，也没有展示不同模型对工具调用、结构化输出、流式事件支持度的差异。教学目标是先把注意力放在 **LangChain 应用层接口** 上。

### 为什么再看这段：最小 message-based 调用到底怎么写

接着看这一章的主线 demo，它展示了最基础的一次消息调用。

```ts
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createDemoModel } from "../../shared/model";

export const runLlmDemo = async () => {
  const model = createDemoModel();

  const response = await model.invoke([
    new SystemMessage("你是一个帮助前端工程师快速理解技术概念的助手。"),
    new HumanMessage("请用 3 句话解释什么是 LangChain.js，并说明它对前端开发有什么价值。"),
  ]);

  console.log(String(response.content));
};
```

这段代码处在本章流程的**真正执行入口**：先创建 model，再构造 message 数组，再调用 `invoke(...)` 拿到响应。

它对应的是官方文档里的 **Messages + invoke**：模型接收的不是单一字符串，而是带角色语义的消息序列。

这里刻意简化的地方是：当前 demo 只使用了 `SystemMessage` 和 `HumanMessage`。在更完整的 LangChain 运行时里，你还会看到 `AIMessage`、`ToolMessage`、历史消息、retrieval 注入结果等更多上下文元素。

### 为什么最后看这段：响应对象并不是裸字符串

同一个 demo 里还有一个很容易被忽略的细节。

```ts
const response = await model.invoke([...]);
console.log("output:", String(response.content));
```

这里说明模型返回值通常不是“字符串本体”，而是一个消息对象，你最后读取的是它的 `content`。

这在官方概念里对应 **message-shaped output**。它的价值是：后面的 chain、agent、tool calling、streaming，都可以继续围绕消息对象做处理，而不是每一步都退回到脆弱的字符串世界。

这里刻意简化的是：本章没有展示响应对象上更丰富的元数据，例如 token usage、tool call 信息、事件流等，因为这些会在后面章节里逐步出现。

## 关键 API / 运行时形态

这一章最应该先理解的不是某个类名，而是几种常见运行时形态。

### `invoke(...)`

最基础的一次性调用方式。给模型完整输入，等待完整输出，再一次性拿到结果。

适合：
- 最小 demo
- 后台任务
- 不需要实时渲染的场景
- 先建立基础认知

### `stream(...)`

流式返回输出 chunk。对前端特别重要，因为它能让 UI 在模型还没完整生成前就开始显示内容。

适合：
- 聊天界面
- 长文本生成
- 需要降低等待焦虑的交互

### `batch(...)`

批量处理多组输入。更偏后端任务或离线处理场景，前端直接用得少，但理解它有助于你建立“LangChain 不只是聊天 UI 工具”的认识。

### 为什么这三种形态值得一起理解

它们本质上是在回答同一个问题：**同样的模型能力，以什么运行时方式暴露给应用。**

- `invoke`：一次性拿结果
- `stream`：边生成边消费
- `batch`：一次提交多组输入

官方文档会把它们并列，是因为 LangChain 不是只服务聊天界面。你以后会发现：结构化输出、agent、retrieval、streaming，都是在这些运行时形态之上继续叠加。

## 前端接入时要注意什么

### 1. 浏览器不应该直接持有模型密钥

这一章虽然是最基础的调用，但在真实产品里通常不会让浏览器直接连模型服务，尤其是涉及私有 key、计费账号或内部模型网关时。更常见的边界是：

- 前端负责采集用户输入、展示状态、渲染响应
- 服务端负责真正发起模型调用
- LangChain 通常跑在服务端或边缘运行时

本仓库用 Ollama 做本地教学，所以这个问题被弱化了，但产品里必须有这个意识。

### 2. 消息对象比长字符串更适合状态管理

前端本来就擅长管理数组、列表和带类型的数据结构。messages 正好契合这一点。你在 React / Vue 里维护消息数组，会比维护一个不断拼接的大字符串更自然，也更容易支持：

- 多轮对话
- 撤回 / 重试
- 工具结果插入
- streaming 增量更新
- 历史消息持久化

### 3. 一次调用成功，不代表应用模型设计合理

初学时很容易把重点放在“能不能调通模型”。但从应用设计角度看，更重要的是：

- 输入边界是否清晰
- 哪些消息应该进入上下文
- 是否需要结构化输出而不是自由文本
- 是否应该走 agent / retrieval / tools，而不是继续堆 prompt

## 能力边界与 tradeoff

### 什么时候只用 model 调用就够了

如果你的需求只是：
- 简单问答
- 单步改写
- 文案润色
- 摘要生成

那么直接 `invoke()` 往往已经够用。

### 什么时候单次调用会开始不够用

当你需要：
- 更稳定的结构化返回
- 调用系统能力或外部数据
- 跨轮记忆
- 外部知识检索
- 流式事件更新

这时就应该进入后面几章的能力，而不是继续把所有问题都堆进一个 prompt。

### 主要 tradeoff

- 直接 model 调用：简单、延迟低、可调试，但能力有限
- 更复杂的上层能力：更强、更接近真实应用，但需要更多运行时编排

## 这一章没有展开的能力，其实是什么

这一章最容易被一句“这里做了简化”带过去，但这些能力本身值得提前知道。

### 1. 更完整的 message 流

真实 LangChain 应用里，进入 model 的通常不只 system 和 user 两类消息，还可能包括：

- 多轮历史消息
- tool 返回结果
- retrieval 查到的文档片段
- 中间步骤生成的 AIMessage

也就是说，messages 不是一个教学用概念，而是后续几乎所有高级能力的共同容器。

### 2. Provider 差异为什么仍然重要

虽然 LangChain 做了统一抽象，但 provider 差异并没有消失，只是被压到了更底层。真实工程里你仍然会关心：

- 哪些模型支持更稳定的 tool calling
- 哪些模型支持原生 structured output
- 哪些模型流式体验更好
- 不同 provider 的成本、延迟、速率限制和上下文窗口

本仓库选择统一 Ollama，是为了先稳住心智模型，而不是否认这些差异存在。

### 3. 观测与运行时信息

官方完整能力图谱里还会继续展开 observability、runtime、middleware。原因是：一旦应用变复杂，你就不再只关心“模型答了什么”，还关心：

- 它为什么这么答
- 中间用了哪些上下文
- 有没有调用工具
- token 和延迟消耗是多少

这一章先不展开，是为了避免最开始就把学习重心拉到运行期治理上。

## 与下一章的关系

当你理解了“模型接收的是消息，而不是魔法 prompt”之后，下一步自然就会进入 Prompt / Context Control：

- 同样是模型调用
- 但开始更系统地控制上下文内容
- 开始思考 system prompt、变量注入、模板化和上下文边界

也就是说，下一章不是推翻这一章，而是在这一章的输入模型上继续做精细控制。

## 下一步在官方文档里看什么

建议继续看：

1. Models 页里的 `invoke` / `stream` / `batch`
2. Messages 的不同角色和运行时意义
3. 然后进入本仓库下一章 `docs/02-prompt.md`，理解 Prompt 在今天更像“上下文工程”的一部分
