# 09 Streaming

## 这一章学什么

这一章对应 LangChain 官方文档里的 **Streaming**，也是 Frontend Overview 里非常重要的一章。它解决的不是“模型能不能回答”，而是另一个同样关键的问题：**模型在回答过程中，应用如何把生成过程实时暴露给用户。**

在聊天产品里，用户对系统体验的第一感觉，往往不是最终答案质量，而是：

- 它有没有马上开始响应
- 我现在是在等什么
- 它有没有卡住
- 它是不是还在工作

Streaming 的价值就在于把“整段完成后再返回”改造成“运行中持续产生可消费事件”。这会显著改善感知延迟，即使总耗时不一定真的减少。

而且在现代 LangChain 应用里，streaming 不只意味着 token streaming。随着 tools、agents、memory、retrieval 的引入，前端越来越需要消费的是更丰富的运行时事件：

- 文本 chunk
- agent progress
- tool 调用状态
- custom updates
- 最终结果与中间状态的组合流

## 对应 LangChain 官方文档

- Streaming
- Frontend Overview

官方入口：
- `https://docs.langchain.com/oss/javascript/langchain/streaming`
- `https://docs.langchain.com/oss/javascript/langchain/frontend/overview`

## 本章核心概念

### 1. Token streaming

最常见的 streaming 形式，是模型把输出按 chunk 持续推出来，而不是等完整文本结束后一次返回。

这对聊天 UI 非常关键，因为用户可以更早看到首字、更容易感知系统正在工作。

### 2. Event / progress streaming

在更复杂的应用里，前端不只需要文本，还需要知道系统当前做到了哪里。例如：

- 正在调用哪个工具
- 正在检索资料
- 正在整理结构化结果
- 正在等待下一步决策

这类信息不属于 token 本身，但对产品体验非常重要。尤其是 agent 场景，只有最终文本而没有过程状态，用户往往会觉得系统“什么都没发生”。

### 3. Chunk 是运行时增量，不是最终真相

streaming 时拿到的 chunk 往往只是中间片段。前端必须意识到：

- chunk 可能不是语义完整句子
- 多个 chunk 需要拼接
- 可能还会有非文本事件穿插进来
- UI 不应把每个 chunk 都当成最终稳定数据

### 4. 感知延迟与总延迟不同

这是这一章最重要的产品认知之一。

- **总延迟**：从发起请求到拿到完整结果的时间
- **感知延迟**：用户第一次看到系统有反馈的时间

Streaming 通常更能改善感知延迟，而不是总延迟。也就是说，它首先改善的是用户体验和等待焦虑，而不一定真正减少后端执行时间。

## 先看本仓库里的代码锚点

这一章对应的本地代码是：

- `src/demos/09-streaming/index.ts`

### 为什么先看这段：streaming 的入口不是 `invoke()`，而是返回一个可持续消费的结果流

```ts
const model = createDemoModel();

const stream = await model.stream(
  "请模拟一个前端聊天助手的流式回复，分几小段介绍为什么流式输出能改善用户体验。"
);
```

这段代码处在本章流程的**流创建层**。和 `invoke()` 不同，`stream()` 不会等完整文本全部生成后再把结果一次性交给你，而是先返回一个可继续读取的流。

它对应的是官方文档里的 **streaming response channel**：从应用视角看，模型输出已经从“单次返回值”变成“持续到来的增量结果”。

这里刻意简化的是：当前只展示了最基础的 token streaming，没有加入 agent progress、tool events 或 custom updates。

### 为什么再看这段：chunk 之所以麻烦，是因为它不一定总是一个简单字符串

```ts
const readChunkText = (content: unknown) => {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      if (typeof item === "object" && item && "text" in item) {
        const text = (item as { text?: unknown }).text;
        return typeof text === "string" ? text : "";
      }

      return "";
    })
    .join("");
};
```

这段代码处在**chunk 归一化层**。它的存在恰好说明一个重要事实：流式返回的 chunk 在运行时不一定总是“可以直接渲染的一小段纯文本”。

它对应的是官方语境里的 **stream chunk normalization**：前端通常需要先把不同形态的增量内容整理成统一可消费格式，再进入 UI。

这里刻意简化的是：当前只关心提取文本，没有把更多事件类型建模成结构化状态。

### 为什么最后看这段：流式消费时，前端通常既要实时追加，也要保留最终完整结果

```ts
let aggregated = "";

for await (const chunk of stream) {
  const text = readChunkText(chunk.content);
  aggregated += text;
  process.stdout.write(text);
}

process.stdout.write("\n");
console.log("final:", aggregated);
```

这段代码处在**增量消费层**。`for await ... of` 逐个读取 chunk，`process.stdout.write(text)` 负责即时展示，`aggregated += text` 则保留最终完整文本。

它对应的是官方文档里的 **partial rendering + final aggregation**：流式应用通常同时维护“正在展示的增量状态”和“最终稳定结果”。

这里刻意简化的是：当前 demo 在终端输出，没有浏览器里的取消、滚动、重新渲染、性能节流和并发消息管理。

## 关键 API / 运行时形态

### `stream()`

最基础的流式接口。它会返回一个可持续消费的结果流，而不是一次性完整响应。

### `for await ... of`

在 JavaScript 里，流式消费很自然地会落到异步迭代模式。前端和 Node.js 开发者都应该熟悉这种模式，因为它很适合逐步处理 chunk。

### 增量拼接与最终汇总

streaming 场景里通常同时存在两种状态：

- 用于实时渲染的增量文本
- 用于最终保存和复用的完整文本

这意味着 UI 层往往要同时维护 partial state 和 final state。

## 这一章没有展开的能力，其实是什么

### 1. token streaming 只是 streaming 的第一层

很多人第一次学 streaming，只会看到文本一点点冒出来。但在更完整的 LangChain 运行时里，流里还可能包含：

- 工具调用开始 / 结束
- agent 当前步骤变化
- 自定义进度消息
- 中间结构化状态

也就是说，真正的 streaming 不一定只是“更快显示字”，而是“让运行时过程可见”。

### 2. chunk 不等于一句完整的话

chunk 是模型运行过程中的增量片段，不一定具备句子边界、段落边界甚至词边界。前端如果直接把 chunk 当作稳定业务数据使用，很容易产生状态混乱。

更合理的思路通常是：

- chunk 用于即时展示
- 完整结果用于最终保存
- 中间事件用于状态更新

### 3. 取消、恢复、重播为什么在产品里重要

一旦进入真实 UI，用户就不一定会乖乖等到流结束。你很快就会遇到：

- 用户点击停止生成
- 网络中断
- 页面切换
- 想回看上一次增量过程

所以 streaming 不是简单的 API 技巧，而是会直接扩展成交互和状态恢复问题。

### 4. 队列、branching chat、HITL 为什么会和 streaming 连在一起

官网在 Frontend Overview 里把这些主题放在一起，并不是巧合。因为一旦系统开始持续产生事件，前端就要回答：

- 多条消息是否能并发流式生成
- 一条流中能否插入工具状态
- 是否允许人工中断和改道
- 流中断后是否要形成分支聊天

这些都是 streaming 进一步产品化后自然出现的问题。

## 前端接入时要注意什么

### 1. 需要同时维护 partial UI 与 final message

这几乎是流式聊天 UI 的基础设计。常见做法是：

- 先创建一条空的 assistant message
- 每拿到一个 chunk 就追加内容
- 完成时把这条 message 标记为 settled

如果没有这层状态设计，streaming 很快就会让组件变乱。

### 2. 要考虑取消、重试和中断恢复

真实用户不会永远等一个回答自然结束。前端通常要考虑：

- 用户点击停止生成怎么办
- 网络断开后怎么处理
- 页面切换后是否继续保留流式状态
- 失败后能不能从头重试或重新发起

这些问题在 demo 里不明显，但产品里一定会出现。

### 3. 队列和并发控制很重要

如果用户连续发送多条消息，或者一个 agent 同时产生多类事件，你需要明确：

- 多条流是否并发显示
- 哪条消息处于 active streaming 状态
- 后续消息是否排队
- 中途 tool updates 是否插入同一消息流

这也是 Frontend Overview 会继续讨论 message queues、branching chat 的原因。

### 4. 流式渲染不等于无限细粒度更新

前端更新过于频繁会带来性能问题。真实应用常要做：

- 节流刷新
- 分批合并 chunk
- 在视觉上平滑展示
- 兼顾滚动、选择、复制等交互

也就是说，streaming 不只是数据通道问题，也是 UI 性能问题。

## 能力边界与 tradeoff

### Streaming 适合什么

- 聊天界面
- 长回答生成
- agent progress 展示
- 需要改善等待体验的场景

### Streaming 不一定值得的场景

- 极短回答
- 后台离线任务
- 用户根本不关心中间过程的批处理

### 主要 tradeoff

- Streaming：用户体感更好，但前端状态管理明显更复杂
- 非 streaming：实现简单，但等待体验通常更差

## 与下一章的关系

当前面几章的能力逐渐汇合后，你会发现一个真实应用通常不是单点能力，而是：

- 有模型调用
- 有结构化输出
- 有工具
- 有记忆
- 有检索
- 有 streaming

下一章 Final Agent 就是把这些能力组合成一个更接近应用架构的 capstone。

## 下一步在官方文档里看什么

建议继续看：

1. Streaming 里的 supported stream modes
2. agent progress / custom updates
3. Frontend Overview 里的 queues、branching chat、human-in-the-loop
4. 取消、恢复、重播和 partial rendering 的产品设计问题
5. 然后进入本仓库最后一章 `docs/10-final-agent.md`，看这些能力如何开始形成一个完整应用雏形
