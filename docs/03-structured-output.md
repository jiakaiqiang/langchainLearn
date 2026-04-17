# 03 Structured Output

## 这一章学什么

这一章对应 LangChain 官方文档里的 **Structured Output**。如果说前两章是在建立“模型如何接收上下文”的基础，那么这一章开始解决另一个对前端更关键的问题：**模型返回的结果，怎样才能稳定地进入 UI、状态管理和业务逻辑。**

前端真正需要的通常不是一大段自由文本，而是：

- 可以直接渲染的对象
- 可以回填到表单的字段
- 可以驱动组件状态的枚举值
- 可以被校验、存储、排序和筛选的数据结构

所以这一章的重点不是“让模型看起来更懂 JSON”，而是建立一个 **schema-first** 心智模型：先定义你真正要消费的数据结构，再让模型按这个结构输出，而不是先生成一段自由文本，再在后面做脆弱的字符串解析。

这也是 LangChain 官方文档为什么会把 structured output 放得非常靠前。因为对应用开发者来说，可靠地得到“可用数据”，比得到“好看的段落”更重要。

## 对应 LangChain 官方文档

- Structured Output
- Models
- Frontend Overview

官方入口：
- `https://docs.langchain.com/oss/javascript/langchain/structured-output`
- `https://docs.langchain.com/oss/javascript/langchain/frontend/overview`

## 本章核心概念

### 1. schema-first

schema-first 的意思不是“最后校验一下 JSON”，而是**在调用模型之前，就先明确输出应该长什么样**。例如：

- 用户资料提取应当是 `{ name, age, city }`
- 工单分类结果应当是 `{ type, priority, summary }`
- UI 卡片数据应当是 `{ title, description, actions }`

一旦先定义好 schema，你的应用就不再围绕“模型爱怎么说就怎么说”来设计，而是围绕“应用真正需要什么数据”来设计。

### 2. 结构化输出不是后处理文本

很多初学方案会这样做：

1. 让模型输出一段看起来像 JSON 的文本
2. 再用正则或 `JSON.parse()` 去赌它格式正确

这类方案的主要问题是脆弱：

- 漏字段时难发现
- 多字段类型错了也可能悄悄混过去
- 模型容易附带额外解释文本
- UI 消费层要写很多兜底逻辑

Structured Output 的目标，就是把“文本后处理”变成“模型输出直接对齐应用 schema”。

### 3. strategy 心智模型

官方文档会进一步展开不同 strategy。即使当前 demo 没完全覆盖，你也应该先建立这个认知。

#### Provider-native structured output

如果底层模型或 provider 原生支持结构化响应，那么 LangChain 可以尽量直接利用这种能力。这类方式通常更稳定，但能力边界会受 provider 支持程度影响。

#### Tool-calling-style structured output

把结构化返回看成一次受 schema 约束的“工具调用”。这类方式在很多模型上兼容性更强，也很接近 agent / tool calling 的运行时形态。

#### Parser-style fallback

有些场景仍然会退回到 parser 或文本解析思路。它可用，但通常不如前两种稳定，尤其不适合作为高可靠 UI 数据通道的首选。

### 4. 验证失败并不稀奇

Structured Output 并不意味着“永远 100% 成功”。真实应用里仍然要面对：

- 漏字段
- 类型不匹配
- 内容语义不合理
- 模型给出部分正确、部分错误的结果

但和自由文本相比，structured output 至少让失败变得可检测、可重试、可降级。对工程系统来说，这一点非常重要。

## 先看本仓库里的代码锚点

这一章对应的本地代码是：

- `src/demos/03-structured-output/index.ts`
- `src/learn/formatOutput/index.ts`
- `src/shared/model.ts`

### 为什么先看这段：主线 demo 如何消费结构化结果

先看教学 demo 的入口，它最能说明前端为什么需要 structured output。

```ts
import { extractUserInfo } from "../../learn/formatOutput/index";

export const runStructuredOutputDemo = async () => {
  const input = "请提取用户信息：王明，今年 22 岁，现在住在上海。";
  const structured = await extractUserInfo(input);

  console.log("input:", input);
  console.log("structured:", structured);
};
```

这段代码在本章流程里处于**应用消费层**：它并不关心模型返回了多漂亮的文字，而是直接拿一个 `structured` 对象继续使用。

它对应的是官方文档里的 **application-consumable structured data**：前端真正需要的是能进入表单、卡片、状态管理的数据对象。

这里刻意简化的是：当前 demo 只展示了一个很小的提取场景，没有覆盖嵌套对象、数组、枚举、部分字段缺失等更复杂 UI 情况。

### 为什么再看这段：schema 在模型调用前就已经存在

真正关键的逻辑在 `src/learn/formatOutput/index.ts` 里。

```ts
export const userInfoSchema = z
  .object({
    name: z.string().describe("名字"),
    age: z.number().describe("年龄"),
    city: z.string().describe("城市"),
  })
  .describe("用户信息");
```

这段代码处在本章流程的**结构定义层**。在模型被调用之前，应用已经明确规定了输出必须包含哪些字段、每个字段是什么类型。

这对应的是官方文档里的 **schema-first**：先定义系统真正要消费的结构，再让模型去贴合这个结构。

这里刻意简化的是：本仓库只展示了一个简单对象 schema。真实应用里你还会看到更复杂的嵌套 schema、数组项约束、枚举值、可选字段和更严格的业务验证。

### 为什么还要看这段：当前仓库采用了 tool-calling 风格

同一个文件里，这段最能说明当前实现到底属于哪种 structured output 思路。

```ts
export const createStructuredOutputAgent = () => {
  return createAgent({
    model: createDemoModel(),
    responseFormat: toolStrategy(userInfoSchema, {
      toolMessageContent: "个人信息提取完成",
    }),
  });
};
```

这段代码处在**模型执行策略层**。它没有让模型“自由输出一段 JSON 文本”，而是通过 `toolStrategy(...)` 把 schema 变成一种更受约束的返回路径。

这对应的是官方文档里的 **tool-calling-style structured output**。从运行时上看，这和 tool calling 很接近：模型按约束生成符合 schema 的结果，而不是任意发挥。

这里刻意简化的是：本仓库没有并列展示 provider-native strategy，也没有展示 parser fallback。教学重点是先让你看到：**结构化输出不是 parser 补丁，而是一种正式运行策略。**

### 为什么最后看这段：应用最终拿到的不是文本，而是结构化字段

```ts
const result = await agent.invoke({
  messages: [
    {
      role: "user",
      content: `请从以下内容中提取姓名、年龄和城市，并按结构化结果返回：${text}`,
    },
  ],
});

return result.structuredResponse;
```

这段代码处在**结果提取层**。应用最终读取的是 `result.structuredResponse`，而不是再从文本里手动做二次解析。

它对应的是官方文档里的 **typed result channel**：同一条 AI 调用链路可以产出给系统消费的结构化结果，而不只是给用户看的自然语言。

这里刻意简化的是：当前 demo 假定结果能顺利返回，没有展开失败重试、部分字段容错、人工确认和回退 UI。

## 关键 API / 运行时形态

### `zod` schema

在 JavaScript / TypeScript 生态里，`zod` 非常适合承担“输出结构定义”这件事。它既能描述字段，也能表达类型、可选项和更清晰的数据边界。

### Structured response / schema constrained output

LangChain 会基于你提供的 schema，引导模型返回符合结构的数据对象，而不是单纯字符串。这样你的后续代码消费的就不是“模型说了一段什么”，而是“模型产出了一个满足 schema 的对象”。

### 失败处理形态

真实应用里，这条链路往往还要考虑：

- 校验失败后是否重试
- 是否允许局部字段为空
- UI 是否可以显示“已提取成功的部分结果”
- 是否回退成人工确认流程

这些在官网和真实产品里都比 demo 更重要。

## 前端接入时要注意什么

### 1. 结构化输出是 UI 友好的默认路径

如果你的目标是驱动 UI，而不是只展示一段 AI 文本，那么应该优先考虑 structured output。因为 UI 更关心：

- 字段是否齐全
- 类型是否正确
- 枚举是否可控
- 结果是否能直接渲染

而不是“这段话写得是否自然优美”。

### 2. 不要把校验责任全推给模型

模型可以帮你生成结构，但最后的系统边界依然应该由应用负责验证。前端或服务端都需要明确：

- schema 是最终边界
- 校验失败要有清晰分支
- 不要把未经验证的数据直接写进关键业务流程

### 3. UI 需要容忍部分失败

真实用户输入经常是脏的、含糊的、不完整的。比如：

- 只提到了名字和城市，没提年龄
- 年龄写成了“二十出头”
- 城市是别称或口语表达

所以你的 UI 层往往要考虑：

- 允许部分字段为空
- 让用户确认或补全
- 在提取失败时回退到手动编辑

这比“只要模型一次成功就好”更符合产品现实。

### 4. 结构化输出和表单交互天然契合

前端工程师最值得尽早掌握这一章，就是因为它和表单、卡片、筛选器、状态机天然相连。很多 AI 功能一旦变成 typed object，复杂度会立刻下降，因为它终于能进入现有前端工程体系，而不是停留在“难以消费的一段文本”里。

## 这一章没有展开的能力，其实是什么

### 1. Provider-native structured output 的价值

如果 provider 原生支持结构化返回，LangChain 可以把约束更直接地下沉给模型接口。这类方式通常更稳定，也更省去中间转换成本。但它的代价是更依赖 provider 能力边界。

### 2. Parser fallback 为什么仍然存在

并不是所有模型都稳定支持原生 structured output 或 tool-calling 风格，所以 parser fallback 仍然存在。它的价值是兼容性，但代价是可靠性更差。教学版仓库不优先展示它，是因为前端最需要先建立的是 **schema-first**，而不是学会更多“解析字符串补丁”。

### 3. 验证失败后的产品设计

官网和真实应用都会继续讨论失败后的系统行为，因为 structured output 的关键不只是“成功时多漂亮”，而是“失败时仍然可控”。例如：

- 重试一次还是直接回退
- 哪些字段允许为空
- 是否让用户手动确认
- 是否分成系统消费通道和用户阅读通道

这些都是这一章往后必须面对的问题。

## 能力边界与 tradeoff

### 什么时候优先用 structured output

- 要驱动 UI
- 要把结果写入数据库
- 要给下游 API 使用
- 要做字段级校验
- 要支持局部编辑和重试

### 什么时候自由文本仍然合理

- 创意写作
- 长文解释
- 对话陪伴
- 纯展示型回答

### 主要 tradeoff

- Structured output：更稳定、更易消费，但表达自由度更低
- 自由文本：更自然、更灵活，但后处理成本高、系统可靠性差

很多真实产品会同时用两条通道：

- 一条结构化通道给系统消费
- 一条自然语言通道给用户阅读

## 与下一章的关系

当你已经可以把单次输出变成结构化对象之后，下一步就会遇到一个新问题：**如果任务不是一步完成，而是要经过多个确定性步骤怎么办？**

这就会进入下一章 Chain / Runnable：

- 先提取
- 再改写
- 再校验
- 再生成最终结果

也就是从“单次有结构的输出”进入“多步骤可组合的流程”。

## 下一步在官方文档里看什么

建议继续看：

1. Structured Output 里的 strategy 概念
2. 更复杂 schema 和失败处理方式
3. Frontend Overview 里与 structured UI、typed rendering 相关的内容
4. 然后进入本仓库下一章 `docs/04-chain.md`，理解 Runnable 组合在什么场景下仍然非常有价值
