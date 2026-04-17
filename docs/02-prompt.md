# 02 Prompt / Context Control

## 这一章学什么

这一章会继续讲 Prompt，但会刻意用更接近 LangChain 官方文档的方式来讲：**Prompt 不是 LangChain 的全部，而是 context engineering 的一个重要组成部分。**

很多旧教程把 Prompt 写成一切问题的起点和终点，仿佛你只要不断雕 prompt，就能解决应用里的大部分问题。但真实情况并不是这样。Prompt 很重要，却只负责其中一层：它主要用来帮助你组织模型看到的上下文，控制行为边界、输出风格、变量注入和任务表达。

对前端开发者来说，这个转变非常关键。因为你做的通常不是一次性演示，而是一个需要长期维护的 AI 功能：

- 页面里有不同入口
- 不同组件会传入不同变量
- 输出要落到 UI、表单或状态机里
- 有时还会和 tools、memory、retrieval 一起工作

所以你需要把 Prompt 理解成一种**可维护的上下文控制层**，而不是“一段越长越好的神秘咒语”。

## 对应 LangChain 官方文档

- Messages
- Context Engineering
- System Prompt

官方入口：
- `https://docs.langchain.com/oss/javascript/langchain/context-engineering`
- `https://docs.langchain.com/oss/javascript/langchain/models`

## 本章核心概念

### 1. Prompt 是上下文控制，不是全部架构

Prompt 的作用是告诉模型：

- 你是谁
- 你要完成什么任务
- 输入变量是什么
- 输出应该满足什么约束

但它并不负责：

- 调用外部系统
- 保存长期记忆
- 检索文档知识
- 保证输出一定符合结构
- 管理复杂 agent loop

这些能力分别属于后面的 structured output、tools、agents、memory、retrieval。

### 2. `PromptTemplate` 与 `ChatPromptTemplate`

这是官网语境下非常重要的区分。

#### `PromptTemplate`

更接近“把变量填进一段文本模板”。适合单段 prompt 文本场景，能帮助你避免到处手写字符串拼接。

#### `ChatPromptTemplate`

更适合 message-based 应用。它允许你直接按消息角色组织模板，例如 system / human / placeholder。对于多轮对话和 agent 场景，这种形式通常更自然。

如果你已经接受了上一章的 messages 心智模型，那就会发现：`ChatPromptTemplate` 往往比 `PromptTemplate` 更贴近真实应用。

### 3. system / user / tool 消息职责不同

Prompt 不是只有“用户输入”这一个来源。真实上下文里，常见来源至少包括：

- system：定义行为边界、风格、限制
- user：当前请求
- tool：工具返回的外部结果
- history：历史对话上下文
- retrieval：检索到的外部知识

也就是说，Prompt 设计并不是“写一段好看的文案”，而是**决定哪些上下文应该以什么形式进入模型。**

### 4. 变量注入与上下文拼装

模板的核心价值在于可维护性。当前端页面、接口参数、用户状态不断变化时，你可以用变量注入替代脆弱的字符串拼接。这样做的价值包括：

- 模板和业务变量分离
- 更容易复用
- 更容易调试
- 更适合在服务端和前端之间传递清晰边界

## 先看本仓库里的代码锚点

这一章对应的本地代码是：

- `src/demos/02-prompt/index.ts`

### 为什么先看这段：模板是怎样把任务和变量拼起来的

这段代码展示了最小版 `PromptTemplate`。

```ts
const prompt = PromptTemplate.fromTemplate(
  [
    "你是一名前端架构顾问。",
    "请把下面的需求整理成 3 条可执行建议。",
    "需求：{requirement}",
    "输出要求：每条建议必须简洁，并说明对前端项目的直接价值。",
  ].join("\n")
);
```

这段代码在本章流程里处于**输入构造层**。它没有调用模型，只是在调用前把角色说明、任务目标、变量位置和输出要求组织成一个可维护模板。

它对应的是官方文档里的 **prompt as context control**：prompt 的价值不只是写一句“请帮我”，而是把上下文边界表达清楚。

这里刻意简化的是：当前 demo 使用的是 `PromptTemplate`，也就是单段文本模板。更接近真实对话应用的往往是 `ChatPromptTemplate`，因为那种写法能直接按消息角色组织上下文。

### 为什么再看这段：变量不是拼字符串，而是运行时注入

同一个 demo 的执行代码更能看出模板化的工程意义。

```ts
const chain = prompt.pipe(createDemoModel()).pipe(new StringOutputParser());

const result = await chain.invoke({
  requirement: "我们要在后台管理系统里接入 AI 助手，希望先做一个稳定、可控、易演示的 MVP。",
});
```

这里的 `requirement` 在运行时才被注入模板。也就是说，模板定义和业务变量是分开的。

它在官方概念里对应 **template variables** 和 **runnable composition**：先生成模型可消费输入，再交给 model，再把输出做基础解析。

这里刻意简化的是：本地 demo 只注入了一个变量，也没有展示 placeholder、history、tool results、retrieved docs 等更多上下文来源。但你已经能看到真实应用的基本轮廓：**上下文并不是手工散拼，而是有结构地被组装进去。**

### 为什么最后看这段：prompt 只负责约束，不保证可靠性

模板里这句其实很值得单独看：

```ts
"输出要求：每条建议必须简洁，并说明对前端项目的直接价值。"
```

这类语句属于**软约束**。它会影响模型行为，但不会像 schema 那样形成强约束。

这对应官方文档里 Prompt 与 Structured Output 的边界：prompt 擅长表达任务、角色和风格，但并不天然保证字段完整、类型正确和结果可直接消费。

这也是为什么下一章会进入 structured output，而不是继续无限堆 prompt。

## 关键 API / 运行时形态

### `PromptTemplate.fromTemplate(...)`

最常见的起点。定义一段包含变量占位符的模板，再在运行时注入变量。

### `prompt.format(...)`

把变量注入模板，得到最终文本。对初学者来说，这一步有助于你看清“模型真正看到的内容是什么”。

### `ChatPromptTemplate.fromMessages(...)`

把模板建立在消息层上，而不是一整段文本上。随着应用复杂度提升，这通常是更重要的方向。

### `MessagesPlaceholder`

在更接近官方复杂用法的场景里，历史消息、工具结果、检索结果都可能以占位方式插入聊天模板。这类能力当前仓库没有完整展开，但你要知道它属于 Prompt / context engineering 的重要一部分。

## 前端接入时要注意什么

### 1. Prompt 需要和 UI 状态边界对应

前端常见问题不是不会写 prompt，而是不知道哪些信息该进入 prompt。比如：

- 当前页面路由是否要传入
- 用户选择的语言、语气、格式偏好是否要传入
- 表单已有字段是否要作为上下文
- 历史对话要传多少轮

这些都属于 context engineering，而不只是“文案润色”。

### 2. Prompt 很脆弱，不能承担全部可靠性

只靠 prompt 约束模型，非常容易遇到：

- 输出格式漂移
- 漏字段
- 风格不稳定
- 变量遗漏
- 上下文过长后规则失效

这也是为什么官网会很快引向 structured output、tools 和 memory。Prompt 可以提升概率，但不能单独承担系统可靠性。

### 3. 要警惕 prompt injection 和上下文污染

一旦你的应用会把用户输入、外部文档、工具结果拼到模型上下文里，就会遇到 prompt injection 风险。最常见的问题是：

- 用户故意要求忽略系统规则
- 外部文档包含误导性文本
- 工具返回结果里混入不应被当作指令的内容

前端开发者如果把 AI 接入文档问答、网页摘要、知识库助手，就必须开始有这个安全意识。

### 4. 上下文长度管理是产品问题，不只是模型问题

上下文越长，成本越高、延迟越高、有效约束反而可能下降。很多时候你真正需要的不是“把更多内容塞进去”，而是：

- 只保留当前任务相关上下文
- 把历史内容摘要化
- 把长期信息放进 memory，而不是每次都塞进 prompt
- 把知识查找交给 retrieval，而不是直接拼长文档

## 这一章没有展开的能力，其实是什么

### 1. Chat-style Prompt 不是“高级版本”，而是更贴近真实应用的版本

`PromptTemplate` 适合先学，但当你进入多轮对话、tool calling 或 agent 场景后，`ChatPromptTemplate` 往往更自然，因为它直接围绕 messages 工作，而不是最后再把一切压扁成一大段字符串。

### 2. Context engineering 的重点是分层

官方文档现在越来越强调 context engineering，而不是单纯 prompt engineering，就是因为真实系统里的上下文来源很多：

- transient context：这次请求临时需要的信息
- persistent context：长期偏好、用户画像等稳定信息
- tool context：外部系统返回的即时结果
- retrieved context：按需查出来的知识片段

本地 demo 先只展示“模板 + 变量”，是为了先把最小工程感建立起来。

### 3. Prompt injection 为什么必须提前有意识

很多人以为安全问题只在 agent 或工具阶段才出现，其实从 prompt 拼装开始就已经出现了。只要你把用户输入、网页内容、文档内容拼进上下文，就必须开始思考：

- 哪些内容只是 data，不该被当成 instruction
- 哪些 instruction 优先级更高
- 哪些外部结果需要先清洗或摘要

这一章还不解决这些问题，但必须先建立意识。

## 能力边界与 tradeoff

### Prompt 适合解决什么

- 角色设定
- 风格约束
- 变量注入
- 任务表达
- 输出格式的软约束

### Prompt 不适合单独解决什么

- 强可靠结构化输出
- 外部系统访问
- 跨会话记忆
- 长文档知识检索
- 多步决策执行

### 主要 tradeoff

- Prompt 越简单，维护越轻，但控制越弱
- Prompt 越复杂，单次效果可能更好，但更脆弱、更难复用
- 模板化能提升工程可维护性，但并不会自动带来系统级可靠性

## 与下一章的关系

当你开始意识到“Prompt 只能软约束输出”之后，下一步就自然会进入 Structured Output：

- Prompt 可以说“请返回 JSON”
- 但 Structured Output 才会真正把输出变成 schema 约束下的数据对象

这对前端尤其重要，因为 UI 真正需要的往往不是一段漂亮文本，而是一份可以直接消费的数据。

## 下一步在官方文档里看什么

建议继续看：

1. Context Engineering 中关于上下文分层的解释
2. `ChatPromptTemplate`、message placeholders 的使用方式
3. 然后进入本仓库下一章 `docs/03-structured-output.md`，理解为什么 typed output 比自由文本更适合前端应用
