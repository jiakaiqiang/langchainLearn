# 08 Retrieval / RAG Basics

## 这一章学什么

这一章虽然保留了 `RAG` 这个常见名字，但会尽量按 LangChain 官方文档的 **Retrieval** 主线来讲。因为在官方语境里，retrieval 的范围比“问答时查一下知识库”要大得多，它描述的是一整条从外部资料到模型回答的知识增强链路。

最基础的心智模型可以写成：

- 资料从哪里来
- 资料如何被切分、索引、表示
- 用户提问时如何找到相关片段
- 找到的片段怎样进入模型上下文
- 模型如何基于这些片段生成回答

也就是说，retrieval 不是给模型“增加记忆”，而是让模型在运行时**按需访问外部知识**。这对前端团队尤其重要，因为很多真实问题都不是大模型预训练就知道的，而是你的业务资料、组件规范、接口文档、产品手册、内部 wiki。

## 对应 LangChain 官方文档

- Retrieval
- Semantic Search Tutorial
- RAG Tutorial
- Agentic RAG Tutorial

官方入口：
- `https://docs.langchain.com/oss/javascript/langchain/retrieval`

## 本章核心概念

### 1. Retrieval pipeline

一个完整 retrieval 流程通常包含几层：

1. **Ingestion**：把文档收集进系统
2. **Splitting**：把长文档切成更适合检索的小片段
3. **Embedding / Indexing**：把文档表示成适合检索的形式
4. **Storage**：存入向量库或其他检索后端
5. **Retrieval**：根据用户问题找到最相关片段
6. **Generation**：把检索结果交给模型组织答案

很多人把这些都笼统叫作 RAG，但 retrieval 其实覆盖的范围更广。

### 2. `Document`

在 LangChain 语境里，外部知识通常不是直接以原始字符串到处流动，而是以 `Document` 之类的运行时对象承载文本和元信息。这样做的意义在于：

- 能保留来源信息
- 能附带 metadata
- 能支持后续过滤、排序、引用展示

### 3. Keyword retrieval vs semantic retrieval

当前 demo 用的是关键词匹配，这有助于快速理解“先找资料、再回答”的最小流程。但真实系统里更常见的是 semantic retrieval，也就是基于 embedding 语义相似度去找相关片段。

两者差异很重要：

- 关键词检索：简单、便宜、直观，但召回能力弱
- 语义检索：更强、更贴近用户真实表达，但实现复杂度更高

### 4. recall / precision tradeoff

retrieval 不是“查到了就行”，而是始终在权衡：

- recall：是否尽量把相关内容都找出来
- precision：是否尽量只返回真正相关的内容

如果召回太少，模型会缺资料；如果召回太多，模型会被噪音淹没。这个 tradeoff 直接影响最终回答质量。

### 5. Retrieval 与 Memory 的边界

这是上一章延续下来的关键问题。

- memory 更像关于用户和会话的持续信息
- retrieval 更像按需访问外部知识库

把组件文档、产品规范、接口说明存进 memory，通常不是好方案；这些更适合 retrieval。

### 6. Retrieval 既可以是 chain，也可以是 agent 的一部分

在有些场景里，retrieval 就是一条固定链路：

- 用户提问
- 检索文档
- 生成答案

但在更复杂的场景里，retrieval 也可以成为 agent 的一个 tool，让 agent 决定什么时候查、查几次、查什么范围。这就是官网会继续展开 agentic RAG 的原因。

## 先看本仓库里的代码锚点

这一章对应的本地代码是：

- `src/demos/08-rag/index.ts`

### 为什么先看这段：本地知识源首先要被组织成“可检索语料”

```ts
type DemoDocument = {
  id: string;
  title: string;
  content: string;
};

const documents: DemoDocument[] = [
  {
    id: "doc-1",
    title: "Table 组件规范",
    content: "Table 适合展示列表数据，常见关注点包括 columns 定义、分页、排序和 loading 状态。",
  },
  {
    id: "doc-2",
    title: "Modal 交互规范",
    content: "Modal 适合做确认、编辑和详情查看，重点是 open 状态管理、关闭回调和表单提交。",
  },
];
```

这段代码处在本章流程的**语料准备层**。虽然这里只是一个本地数组，但它已经表达了 retrieval 最基本的一步：先有一批独立文档，后面才谈得上检索。

它对应的是官方文档里的 **ingestion corpus / document collection**：真实系统里这些文档可能来自数据库、CMS、文件系统、wiki 或对象存储，但心智模型相同。

这里刻意简化的是：当前文档没有 metadata、没有 chunking、没有来源字段，也没有使用 LangChain 的 `Document` 对象。

### 为什么再看这段：最小 retrieval 的关键在于“给定 query，返回相关片段”

```ts
const retrieveDocs = (query: string, topK = 2) => {
  return documents
    .filter((doc) => doc.content.includes(query) || doc.title.includes(query))
    .slice(0, topK);
};
```

这段代码处在**检索层**。它虽然只是 `includes()` 匹配，但已经完整体现了 retriever 的核心动作：接收查询，返回若干相关文档。

它对应的是官方语境里的 **retrieval step / retriever contract**：无论底层是关键词匹配、向量检索还是混合搜索，上层最关心的都是“query -> relevant docs”。

这里刻意简化的是：当前是关键词精确匹配，无法处理同义表达、语义相近但不含相同词面的查询，也没有重排或评分。

### 为什么最后看这段：RAG 真正成立的关键，是把检索结果重新送回回答链路

```ts
const query = "Table";
const retrieved = retrieveDocs(query);

const answer = retrieved.length
  ? `根据检索到的文档，${retrieved[0].content}`
  : "没有找到相关文档。";
```

这段代码处在**生成前上下文注入层**。真正重要的不是“找到了资料”本身，而是这些资料接着被用于组织最终回答。

它对应的是官方文档里的 **retrieval-augmented generation**：检索不是终点，生成阶段才是它真正发挥价值的地方。

这里刻意简化的是：当前回答并没有再次调用模型，只是把第一条命中文档拼成结果文本。教学目的，是先让你看清 retrieval data flow，而不是同时引入更多变量。

## 关键 API / 运行时形态

### 文档 -> 检索结果 -> 模型上下文

retrieval 最重要的运行时形态不是某个函数名，而是数据流：

- 文档先进入检索系统
- 用户问题触发查询
- 返回若干相关片段
- 这些片段再进入模型上下文

也就是说，retrieval 不是“模型自己想起来了”，而是“应用在回答前动态补充了外部知识”。

### Retriever 抽象

在更完整的 LangChain 体系里，retriever 是很重要的抽象层。它让你的上层应用可以更少关心底层到底是关键词搜索、向量搜索还是混合检索，而更多关心“给定 query，返回相关文档”。

### 上下文注入策略

检索到的内容并不是无脑全塞给模型。真实应用还要考虑：

- 取前几个结果
- 如何排序
- 是否要带来源信息
- 是否要先压缩或总结
- 是否允许用户查看引用来源

## 这一章没有展开的能力，其实是什么

### 1. embeddings 解决的不是存储问题，而是语义表示问题

很多人会把 embeddings 和 vector store 一起提，但它们解决的不是同一件事。embeddings 的作用是把文本变成可比较语义相似度的向量表示，这样检索系统才能在“词面不同、语义相近”的情况下仍然找到相关内容。

没有 embeddings，检索通常更依赖字面命中；有了 embeddings，检索才更接近“按意思找资料”。

### 2. vector store 解决的是高效相似检索问题

当文档数量一大，单纯遍历数组就不再可行。vector store 的作用是：

- 存储向量化后的文档片段
- 支持高效相似搜索
- 通常还能配合 metadata 过滤、topK、混合检索等能力

所以它不是“更高级的数组”，而是 retrieval 系统的重要基础设施。

### 3. retriever 是上层应用最该依赖的抽象

真实项目里，你通常不希望业务层直接依赖“某个向量库 SDK 的某个搜索函数”。更稳定的做法是依赖 retriever 抽象，因为它表达的是业务真正关心的事：

- 输入一个 query
- 返回一组相关文档

这样你底层可以从关键词搜索换成向量搜索、从单库换成混合检索，而上层流程不必大改。

### 4. 为什么当前 `includes()` 检索仍然有教学价值

虽然它离真实 RAG 很远，但它非常适合先帮助你看清 retrieval 的骨架：

- 先有文档
- 再有查询
- 然后返回候选片段
- 最后把片段送入回答环节

当这个骨架先建立起来后，再去理解 embeddings、vector stores、reranking、agentic RAG 就会容易得多。

## 前端接入时要注意什么

### 1. Retrieval 是知识接入层，不只是问答增强

对前端团队来说，它可以服务很多场景：

- 组件库问答
- 设计规范助手
- API 文档助手
- 运营后台知识问答
- 内部工程规范问答

所以 retrieval 不应该只被看成“聊天机器人能力”，而更像一种把知识接进应用的方式。

### 2. 检索质量直接决定回答质量

很多团队会把回答差归咎于模型，但在 retrieval 场景里，真正的问题可能出在：

- 文档切分不合理
- 召回不准
- 结果过多或过少
- 过期资料被召回
- 关键信息没有 metadata 标注

这说明 retrieval 是一个独立的工程问题，不只是模型参数问题。

### 3. UI 往往需要来源感知

一旦进入知识问答，用户就会关心“你是根据什么说的”。前端通常要考虑：

- 是否展示引用来源
- 是否允许展开原文片段
- 是否标注文档标题和更新时间
- 是否让用户点击跳转原始资料

这也是为什么 `Document` metadata 在产品层面很重要。

### 4. Retrieval 不等于把整本手册塞进 prompt

很多初学者会直接把一整份长文档拼进 prompt。这样做通常会带来：

- 成本高
- 延迟高
- 上下文冗余
- 相关内容反而被淹没

retrieval 的价值就在于按需取用，而不是一次性全量灌入。

## 能力边界与 tradeoff

### Retrieval 适合什么

- 基于外部资料回答问题
- 私有知识问答
- 文档辅助决策
- 需要引用来源的回答

### Retrieval 不适合什么

- 代替长期用户记忆
- 解决纯创意生成问题
- 用非常少量、完全固定的知识却仍然强行上复杂检索系统

### 主要 tradeoff

- 检索越强，回答越有根据，但系统复杂度更高
- 返回结果越多，召回可能更全，但噪音也更大
- 语义检索更强，但成本和实现门槛更高

## 与下一章的关系

当外部知识已经能接进回答链路后，前端下一步最关心的通常不是“还能再查多少资料”，而是：**用户在等待这些过程发生时，界面如何实时反馈。**

这就会进入 Streaming。尤其在 agent 或 retrieval 场景里，streaming 往往不再只是 token 输出，而是整个运行过程的状态呈现。

## 下一步在官方文档里看什么

建议继续看：

1. Retrieval 全部章节
2. semantic search tutorial
3. basic RAG 与 agentic RAG 的差异
4. 引用来源、metadata 和检索质量调优问题
5. 然后进入本仓库下一章 `docs/09-streaming.md`，理解为什么 streaming 是前端 AI 体验的核心能力之一
