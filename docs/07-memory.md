# 07 Memory

## 这一章学什么

这一章对应 LangChain 官方文档里的 **Short-term Memory** 和 **Long-term Memory**。这是现代 LangChain 叙事里非常关键、也最容易被混淆的一章，因为“memory”这个词太容易被笼统化。

在旧教程里，memory 常被简单理解成“让模型记住之前说过的话”。这只是其中一部分，而且只对应短期上下文。官方文档现在更强调：**memory 至少要分成两类问题来看。**

- short-term memory：当前线程 / 当前会话里保留什么上下文
- long-term memory：跨线程 / 跨会话要保存哪些持久信息

一旦这两类问题混在一起，设计很容易出错：

- 不该长期保存的临时内容被持久化了
- 本该长期保存的用户偏好每轮都重新问一遍
- 上下文越来越长，成本和延迟不断上升
- retrieval、memory、history 三者职责开始打架

所以这一章最重要的不是“怎么让 agent 会记忆”，而是建立 **该记什么、不该记什么、记在哪里** 的边界感。

## 对应 LangChain 官方文档

- Short-term Memory
- Long-term Memory

官方入口：
- `https://docs.langchain.com/oss/javascript/langchain/short-term-memory`
- `https://docs.langchain.com/oss/javascript/langchain/long-term-memory`

## 本章核心概念

### 1. Short-term memory

short-term memory 更接近“线程内上下文管理”。它主要解决：

- 当前会话还记不记得上文
- 同一线程里的消息是否可见
- agent 是否能基于刚刚发生的交互继续行动

它关注的是**当前任务连续性**，而不是永久保存。

### 2. Long-term memory

long-term memory 更接近“用户档案 / 持久偏好 / 可复用事实”。它主要解决：

- 是否记住用户偏好
- 是否跨会话保留重要信息
- 后续线程能否再次读取这些信息

它关注的是**跨会话持续性**，而不是当前线程的消息堆积。

### 3. Memory 和 Retrieval 不是一回事

这是这一章非常重要的边界。

- memory：更偏向关于用户、会话、个体交互历史的持续信息
- retrieval：更偏向从外部知识源按需查找资料

举例来说：

- “用户偏好深色主题”更像 memory
- “Table 组件文档怎么写”更像 retrieval

如果你把所有事情都塞进 memory，系统会很快变得混乱且昂贵。

### 4. 不是所有信息都值得记住

真实产品里，一个高质量 memory 系统首先要解决的是“遗忘”与“筛选”，而不是“尽量多记”。

更适合写入 memory 的通常是：

- 稳定偏好
- 长期身份信息
- 后续会反复用到的用户约束
- 明确可复用的事实

不适合长期写入的通常是：

- 临时讨论细节
- 一次性错误输入
- 很快失效的中间状态
- 可从外部系统重新获取的信息

## 先看本仓库里的代码锚点

这一章对应的本地代码是：

- `src/demos/07-memory/index.ts`

### 为什么先看这段：当前 demo 从一开始就把短期记忆和长期记忆分成了两个存储位

```ts
const checkpointer = new MemorySaver();
const store = new InMemoryStore();
```

这段代码处在本章流程的**记忆层初始化位置**。`MemorySaver` 和 `InMemoryStore` 并排出现，本身就在表达一个非常重要的教学信号：当前线程连续性和跨会话持久化不是同一个问题。

它对应的是官方文档里的 **short-term vs long-term memory split**：不是所有“记住”的需求都应该落到同一个容器里。

这里刻意简化的是：当前两者都还是内存态示例，没有接真实数据库、用户身份系统、TTL 或删除策略，但边界已经被清楚拉开了。

### 为什么再看这段：long-term memory 的关键不只是“存”，而是把什么事实写成可复用记录

```ts
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
```

这段代码处在**长期记忆写入层**。它没有把整段对话原样塞进持久存储，而是把“用户偏好组件”提炼成一个结构化、可复用的事实再写入 `store`。

它对应的是官方语境里的 **memory write pattern**：长期记忆最重要的不是能不能持久化，而是写入内容是否值得长期保留。

这里刻意简化的是：当前写入逻辑非常直接，没有额外做重要性判断、冲突合并、过期清理或人工确认。

### 为什么还要看这段：short-term memory 不是靠“神奇记忆”，而是靠线程标识把上下文串起来

```ts
const config = { configurable: { thread_id: "memory-demo-thread" } };

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
```

这段代码处在**线程连续性建立层**。`thread_id` 的作用不是保存长期档案，而是告诉运行时：这几轮交互属于同一个线程，需要让当前上下文延续下去。

它对应的是官方文档里的 **thread-scoped short-term memory**：短期记忆通常不是“永远保存”，而是“同一条会话线里的连续可见性”。

这里刻意简化的是：当前 demo 只有一个固定线程，没有多用户、多窗口、多分支聊天等复杂会话管理场景。

### 为什么最后看这段：memory 的价值要通过“后续能读取并继续回答”才能体现出来

```ts
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

const stored = await store.get(["preferences"], "u1");
```

这段代码处在**记忆读取与验证层**。前一轮写入后，后一轮不仅能在同线程继续理解上下文，还能从 `store` 中读取到长期偏好记录。

它对应的是官方语境里的 **memory read path**：真正的 memory 价值，不是“写过一次”，而是“后续回合确实能被正确读取和利用”。

这里刻意简化的是：当前 demo 直接读的是一个很小的 key-value 记录，没有更复杂的检索、排序、冲突解决或多条记忆融合。

## 关键 API / 运行时形态

### `MemorySaver`

在当前示例里，`MemorySaver` 承担的是 short-term memory 角色。你可以把它理解成：帮助当前线程保留上下文，使得后续调用还能看见之前的会话内容。

### `InMemoryStore`

当前示例用 `InMemoryStore` 演示 long-term memory。它代表一种跨会话可读取的存储思路，虽然这里只是内存版，但心智模型已经很清楚：长期记忆应该进入可持久化、可检索的独立存储，而不是永远塞在对话消息里。

### read / write 策略

真实应用里，memory 的难点往往不在“能不能存”，而在：

- 什么时候写入
- 写什么
- 什么时候读取
- 读取后如何注入上下文
- 多长时间后需要总结、裁剪或删除

这些策略比单纯的 API 调用更重要。

## 这一章没有展开的能力，其实是什么

### 1. short-term memory 的核心问题其实是上下文治理

很多人会把 short-term memory 想成“保留所有历史消息”，但真实系统里更关键的问题是：

- 该保留多少轮
- 哪些消息该裁剪
- 是否需要先总结再保留
- 旧消息会不会污染当前任务

所以 short-term memory 的核心不只是 continuity，也包括 context budget management。

### 2. long-term memory 更像产品层的用户档案系统

长期记忆并不只是“另一个聊天缓存”。它常常更接近：

- 用户偏好档案
- 可复用事实仓库
- 个性化约束集合
- 跨会话可读的用户状态

这也是为什么 long-term memory 很快会牵涉隐私、权限、删除、可编辑性等产品问题。

### 3. memory 和 retrieval 的边界必须一直保持清楚

如果某条信息本质上是外部知识，比如组件规范、接口文档、产品规则，那么它更应该进入 retrieval 系统，而不是被当作用户记忆长期保存。

反过来，如果一条信息是用户长期偏好，比如“更喜欢偏前端实战风格的回答”，那它就更适合 memory，而不是每次从知识库里再查一遍。

### 4. trim / summarize / delete 为什么重要

官网会继续展开这些能力，是因为上下文永远增长下去并不可行。真实 memory 系统通常要面对：

- 历史太长导致成本变高
- 旧上下文抢占注意力
- 过时偏好仍被沿用
- 用户想修改或删除已保存信息

所以“能记”只是起点，“如何治理记忆”才是后续真正的工程重点。

## 前端接入时要注意什么

### 1. 会话状态和用户档案不要混在一起

前端经常同时维护：

- 当前聊天消息
- 当前线程 ID
- 用户偏好设置
- 最近一次选择的工作空间或项目

这些信息的生命周期不同，不应该都塞进同一个 memory 概念里。否则你会很难决定哪些需要清空，哪些要跨会话保留。

### 2. 上下文会无限增长，必须有裁剪策略

如果 short-term memory 只是不断追加消息，你很快会遇到：

- token 成本上升
- 响应变慢
- 旧上下文污染当前任务
- 模型忽略真正重要的新信息

所以真实系统里通常要考虑：

- trim messages
- summarize messages
- 删除低价值历史
- 分离当前任务上下文和长期偏好

### 3. 长期记忆涉及隐私和持久化责任

一旦开始保存用户信息，就必须考虑：

- 记住了什么
- 保存多久
- 用户能否查看、修改、删除
- 是否包含敏感内容

这在产品场景里不是附加问题，而是设计正题。

### 4. 写入 memory 应该是策略驱动，而不是机械追加

不是每轮对话都应该自动写入长期记忆。更合理的做法通常是：

- 只保存稳定偏好或明确事实
- 对高价值信息做摘要后保存
- 对临时话题只保留在 short-term memory

## 能力边界与 tradeoff

### Memory 适合什么

- 保持对话连续性
- 记录稳定用户偏好
- 复用跨会话事实
- 减少重复提问

### Memory 不适合什么

- 代替知识库检索
- 持续堆积所有历史消息
- 保存大量会快速过期的信息

### 主要 tradeoff

- 记得越多，个性化越强，但成本和隐私责任越大
- 记得越少，系统更轻，但可能显得“没有连续性”
- short-term memory 更贴近即时体验，long-term memory 更贴近产品持续性

## 与下一章的关系

当你分清楚“用户记忆”和“外部知识”不是一回事之后，下一步自然会进入 Retrieval / RAG：

- memory 负责记住与用户和会话相关的持续信息
- retrieval 负责按需查询不适合放进 memory 的外部资料

这两个能力经常一起出现，但绝不能混为一谈。

## 下一步在官方文档里看什么

建议继续看：

1. short-term memory 里的 trimming / summarization
2. long-term memory 里的 read / write patterns
3. 隐私、持久化和记忆治理的产品问题
4. 然后进入本仓库下一章 `docs/08-rag.md`，理解 retrieval 为什么应该和 memory 明确分层
