# LangChain.js 学习计划（前端工程师版）

## 学习目标

-   从前端开发者过渡到 AI Agent 工程能力
-   掌握 Node.js + LangChain.js 构建 AI 应用
-   能够开发 RAG 知识库系统和 Agent 系统

------------------------------------------------------------------------

## 第0周：环境准备

-   安装 Node.js 与 npm
-   安装 langchain 与 @langchain/openai
-   理解 LLM API 调用方式
-   完成一次简单的 LLM 调用

示例安装：

``` bash
npm init -y
npm install langchain @langchain/openai dotenv
```

------------------------------------------------------------------------

## 第1周：LLM 与 Prompt

学习内容：

-   理解 ChatModel
-   学习 PromptTemplate
-   学习 ChatPromptTemplate
-   理解 System Prompt
-   理解 Few-shot Prompt

练习：

实现 **AI 前端知识问答系统**

示例：

用户输入

    解释 React Hooks

AI 输出

    返回 React Hooks 的原理和使用方式

------------------------------------------------------------------------

## 第2周：Chain 工作流

核心概念：

    Prompt → LLM → OutputParser

学习内容：

-   Runnable
-   pipe
-   Chain
-   OutputParser

练习项目：

**AI 文章生成器**

输入

    主题

输出

    完整文章

------------------------------------------------------------------------

## 第3周：RAG 知识库

RAG 工作流程：

    文档
     ↓
    Embedding
     ↓
    Vector Database
     ↓
    相似搜索
     ↓
    LLM 生成回答

学习内容：

-   Document Loader
-   Embedding
-   Vector Store
-   Retriever

练习项目：

**AI 文档问答系统**

功能：

-   上传文档
-   语义搜索
-   问答

------------------------------------------------------------------------

## 第4周：Tool 工具调用

核心能力：

**Function Calling**

流程：

    LLM
     ↓
    判断是否调用 Tool
     ↓
    执行 Tool
     ↓
    返回结果

练习：

实现三个 Tool

-   天气查询
-   网页搜索
-   代码执行

------------------------------------------------------------------------

## 第5周：Agent 系统

Agent 工作流程：

    用户问题
     ↓
    Agent
     ↓
    Tool 调用
     ↓
    结果返回

学习内容：

-   Agent 架构
-   Tool Router
-   Planner

练习项目：

**AI 多工具助手**

能力：

-   查天气
-   查新闻
-   回答问题

------------------------------------------------------------------------

## 第6周：Memory 对话记忆

学习内容：

-   BufferMemory
-   ConversationMemory
-   多轮对话上下文

练习项目：

实现 **ChatGPT 类聊天机器人**

------------------------------------------------------------------------

## 学习完成后能力

完成本学习计划后可以实现：

-   AI Chat 应用
-   RAG 知识库系统
-   AI Agent 系统
-   AI 工作流自动化
