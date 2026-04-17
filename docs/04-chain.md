# 04 Chain / Runnable

## 这一章学什么

这一章学习的是 **Runnable / 多步骤组合** 的心智模型，而不是把 Chain 当成 LangChain 的唯一主角。

在早期教程里，很多人会把 LangChain 理解成“Prompt + Chain 框架”。这种说法在今天已经不够准确。官方文档现在更强调 models、structured output、tools、agents、memory、retrieval、streaming，而 Chain 更适合被理解为：**把多个可预测步骤拼接成一个可维护工作流的基础原语。**

这仍然非常重要，因为真实应用里并不是每个问题都需要 agent 自主决策。很多任务其实是确定性的：

- 先提取，再改写
- 先分类，再路由
- 先生成提纲，再生成正文
- 先检索资料，再总结

这些场景里，用 Runnable / Chain 往往比直接上 agent 更稳定、更容易调试。

## 对应 LangChain 官方文档

- Runnable / 组合思路
- 多步骤处理的工程化思维

## 本章核心概念

### 1. Runnable 是“可组合执行单元”

可以把 Runnable 理解成一种统一执行接口。只要某个步骤遵守相似的输入输出契约，它就可以接到下一个步骤后面。这种统一接口的价值在于：

- 每一步都可以单独测试
- 每一步都可以替换
- 组合关系清晰
- 运行路径比 agent 更可预测

### 2. `pipe` / sequence 心智模型

最直观的 Runnable 思路就是“上一步输出，成为下一步输入”。例如：

- prompt 生成任务描述
- model 生成提纲
- parser 把结果整理成数组
- 下一个 prompt 再根据数组生成正文

这种组合方式适合确定性较强的多步骤流程。

### 3. Chain 与 Agent 的边界

这是这一章最值得理解的地方。

#### Chain 更适合

- 你知道步骤顺序
- 每一步目标明确
- 不需要模型自己决定流程分支
- 你更关心稳定性、可调试性和可控性

#### Agent 更适合

- 是否调用工具要临场决定
- 调用几个工具、顺序如何并不固定
- 需要观察中间结果再决定下一步
- 任务路径不是预先写死的

所以 Chain 和 Agent 不是谁取代谁，而是各自适合不同类型的问题。

### 4. Parser / Structured Output 在链路中的位置

Runnable 并不只等于“prompt 接 model”。它很适合和 parser、structured output 结合，形成更可靠的多步变换：

- 第一步得到结构化字段
- 第二步基于结构化字段做路由
- 第三步生成最终文案或 UI 数据

这也是为什么现代 LangChain 不再把 Chain 当成唯一中心，而是把它当成可与其他能力自由组合的基础构件。

## 先看本仓库里的代码锚点

这一章对应的本地代码是：

- `src/demos/04-chain/index.ts`

### 为什么先看这段：两段 prompt 各自承担什么职责

```ts
const outlinePrompt = PromptTemplate.fromTemplate(
  "请为主题 \"{topic}\" 生成 3 条适合前端团队分享的提纲。"
);

const polishPrompt = PromptTemplate.fromTemplate(
  [
    "你会收到一个提纲，请把它改写成更适合分享会开场的版本。",
    "提纲：{outline}",
    "输出要求：保留 3 条编号列表，每条 1 句话。",
  ].join("\n")
);
```

这段代码在本章流程里处于**步骤定义层**。它把一个大任务拆成两个可解释的小任务：先生成提纲，再把提纲润色成开场白。

它对应的是官方概念里的 **deterministic step decomposition**：当你知道步骤顺序时，用多个明确步骤往往比一次性大 prompt 更稳定。

这里刻意简化的是：当前 demo 只有两步，而且每一步都是纯文本输入输出。更完整的 runnable 流程里，步骤之间也可以传结构化对象、检索结果或其他运行时对象。

### 为什么再看这段：`pipe(...)` 才是 Runnable 组合的关键动作

```ts
const outlineChain = outlinePrompt.pipe(createDemoModel()).pipe(new StringOutputParser());
const polishChain = polishPrompt.pipe(createDemoModel()).pipe(new StringOutputParser());
```

这段代码处在**组合层**。`PromptTemplate` 先生成模型输入，`createDemoModel()` 负责推理，`StringOutputParser()` 再把结果整理成后续步骤更容易消费的形式。

它对应的是官方文档里的 **Runnable composition**：每一步都遵守相对稳定的输入输出契约，因此可以被串起来。

这里刻意简化的是：当前 parser 只是 `StringOutputParser()`，也就是把输出当纯文本处理。更完整的链路里，parser 可以换成结构化解析，或者直接让步骤产出 schema 约束后的对象。

### 为什么最后看这段：链式流程的核心是“上一步输出进入下一步”

```ts
const outline = await outlineChain.invoke({ topic: "在前端项目中引入 LangChain.js" });
const finalText = await polishChain.invoke({ outline });
```

这段代码处在**串行执行层**。第一步产出的 `outline` 不是最终结果，而是第二步的输入。

它对应的是官方语境里的 **sequence data flow**：多步骤流程的关键不是“调用了几次模型”，而是中间结果如何在步骤间流动。

这里刻意简化的是：当前 demo 没有分支、并行、失败回退或中间步骤校验，但它已经把最核心的数据流展示清楚了。

## 关键 API / 运行时形态

### `pipe(...)`

最常见的组合方式。把上一步的输出接到下一步。它的价值不在语法本身，而在于清晰表达运行顺序。

### `RunnableSequence`

可以把多个步骤显式组织成顺序执行流程。虽然当前 demo 没有把所有 Runnable 细节展开，但你要知道官方文档里强调的是一种统一可组合执行模型，而不是“只有传统 chain 类”。

### 每一步都是可观察的中间态

相比 agent，chain 的一个显著优势是中间结果更容易拿出来看。你可以很清楚地知道：

- 第一步生成了什么
- 第二步为什么出错
- 哪一步引入了漂移

这对调试和产品迭代非常重要。

## 前端接入时要注意什么

### 1. 多步骤流程更适合产品化拆分

前端很多 AI 功能并不是一口气生成最终结果，而是可以自然拆成几个阶段。例如：

- 用户输入需求
- 第一步抽取关键信息
- 第二步分类或路由
- 第三步生成最终卡片或建议

一旦这么拆，你的 UI 也会更好设计，因为每一步都能对应明确状态。

### 2. 链路越长，延迟越高

Chain 的代价是步骤多了，延迟和成本通常也会上升。所以你要权衡：

- 是不是确实需要多步
- 哪些步骤可以合并
- 哪些步骤更适合结构化输出而不是再问一次模型

### 3. 可预测性是 Chain 的核心价值

很多前端同学第一次接触 agent 会很兴奋，但产品里并不是所有问题都适合放权给 agent。对需要稳定交付的功能来说，chain 的确定性常常更有价值，因为它更容易复现问题，也更容易做回归验证。

## 这一章没有展开的能力，其实是什么

### 1. Runnable 不只是串行文本链

官方更完整的 Runnable 体系并不只服务“prompt -> model -> parser”这种线性文本流程。真实工程里它还可以承载：

- 结构化对象在步骤间流动
- 检索步骤和生成步骤组合
- 条件分支和路由
- 并行子步骤合并结果

本地 demo 先用最直观的文本例子，是为了把基本心智模型讲清楚。

### 2. Parser 与 Structured Output 的关系

在教学版 demo 里，`StringOutputParser()` 只是把输出当普通文本处理。但在真实应用里，你会很快发现 parser 和 structured output 可以结合：

- 某一步先拿到结构化字段
- 再基于字段做确定性处理
- 最后再交给下一步生成文本或 UI 数据

所以 chain 并不是和 structured output 对立，而是非常适合承载结构化中间态。

### 3. 为什么很多任务其实不需要 agent

官方文档强调 agents，但这不意味着所有问题都该上 agent。只要你的步骤顺序是已知的，chain 往往更便宜、更稳、更容易调试。理解这一点，能帮你避免把简单问题过度 agent 化。

## 能力边界与 tradeoff

### Chain 适合解决什么

- 确定性的多步骤转换
- 文本加工流水线
- 提取 -> 归一化 -> 生成
- 检索 -> 总结 -> 渲染数据

### Chain 不擅长什么

- 动态决定是否调用外部工具
- 多工具多轮观察后再决策
- 开放式任务规划

### 主要 tradeoff

- Chain：更稳定、更容易调试，但灵活性较低
- Agent：更灵活、更接近开放任务，但成本和不确定性更高

## 与下一章的关系

当你知道哪些任务可以写死成确定性流程之后，下一步自然就会遇到一个反面问题：**如果流程不能提前写死，而是要让模型决定何时查数据、何时调用能力怎么办？**

这就进入下一章 Tools。因为 Agent 之所以能动起来，前提是模型被授予了可调用的外部能力。

## 下一步在官方文档里看什么

建议继续看：

1. Runnable 组合思路和可组合执行模型
2. 结构化输出与多步骤流程如何结合
3. 然后进入本仓库下一章 `docs/05-tools.md`，理解工具调用为什么是现代 LangChain 应用的关键分界线
