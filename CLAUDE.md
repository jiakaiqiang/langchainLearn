# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development commands

- Install dependencies: `pnpm install`
- Run the main learning entrypoint in dev mode: `pnpm dev`
- Build TypeScript to `dist/`: `pnpm build`
- Run the built output: `pnpm start`

There is no dedicated test or lint script in `package.json` right now. If you add one, update this file.

## Project purpose

This repository is a TypeScript learning sandbox for LangChain.js concepts. It contains two parallel code paths:

1. `src/` — a simple end-to-end demo app covering model calls, chains, tools, RAG, agents, and in-memory chat history.
2. `src/learn/` — focused experiments for newer LangChain agent patterns such as tool calling, long-term memory, short-term memory, middleware, and structured output.

`src/main.ts` is currently wired to the experimental `src/learn/formatOutput/index.ts` example rather than the older `src/index.ts` demo flow.

## High-level architecture

### 1. Core demo flow under `src/`

The older demo path is orchestrated from `src/index.ts`:

- Loads hard-coded documents with `src/rag/loader.ts`
- Stores them in a fake in-memory vector store via `src/rag/vectorStore.ts`
- Retrieves matches with substring filtering in `src/rag/retriever.ts`
- Runs a chain in `src/chains/articleChain.ts`
- Runs an "agent" in `src/agents/assistantAgent.ts`
- Persists chat history in `src/memory/chatMemory.ts`
- Uses simple example tools in `src/tools/*.ts`

Important detail: the `src/agents/assistantAgent.ts` implementation is not a real planning/tool-using agent yet; it just delegates to `runArticleChain`. Treat this folder as a teaching scaffold, not production architecture.

### 2. Model and prompt layer in `src/`

- `src/shared/model.ts` is the central model factory and the demos are standardized on `ChatOllama` with model `qwen3.5:cloud` unless `OLLAMA_MODEL` overrides it.
- `src/prompts/assistantPrompt.ts` contains the base assistant prompt string used by the chain.
- `src/chains/articleChain.ts` is the only place in the old path that actually invokes the older model-backed chain flow. It also has a timeout fallback that returns mock content instead of failing hard.

If you change model behavior, verify `src/chains/articleChain.ts`, `src/llm/model.ts`, and `src/shared/model.ts` together.

### 3. Experimental LangChain agent examples under `src/learn/`

`src/learn/` is where current experimentation is happening. The examples share a repeated pattern:

- A `ChatOllama` model is configured with `qwen3.5:cloud`
- `createAgent(...)` from `langchain` is used to assemble different capabilities
- Specific examples swap in tools, stores, checkpointers, or response formatting strategies

Key subareas:

- `src/learn/llm/model.ts` binds tools to a model for direct tool-calling demos.
- `src/learn/tools/getWeathre.ts` defines the main example tool and demonstrates use of `ToolRuntime`, `writer`, and `context`.
- `src/learn/memeory/langMemeory.ts` demonstrates long-term memory with `InMemoryStore` plus explicit save/get tools.
- `src/learn/memeory/lowMemory.ts` demonstrates short-term conversational memory with `MemorySaver` as a checkpointer.
- `src/learn/middleware/index.ts` is the start of a middleware-oriented agent example but is currently only a thin `createAgent` wrapper.
- `src/learn/formatOutput/index.ts` demonstrates structured output via `toolStrategy(outputSchema, ...)`.
- `src/learn/agents/assistantAgent.ts` is a minimal `createAgent` wrapper and appears to be an in-progress streaming example.

### 4. Runtime entrypoint status

`src/main.ts` is a scratchpad-style entrypoint used to manually switch between examples by commenting/uncommenting imports and sample invocations. The file contains multiple preserved experiments and currently executes the structured-output example.

When modifying examples, check which import in `src/main.ts` is active before assuming what `pnpm dev` will run.

## External dependencies and environment

- `dotenv/config` is loaded in the older `src/index.ts` and `src/learn/llm/model.ts` paths.
- The Ollama-based learning examples assume a model named `qwen3.5:cloud` is available to `@langchain/ollama`.

## Documentation map

The `docs/` directory is organized as concept notes rather than deep implementation docs:

- `01-llm.md`
- `02-prompt.md`
- `03-chain.md`
- `04-rag.md`
- `05-tools.md`
- `06-agent.md`
- `07-memory.md`

Use these as topic labels for the repo, but read the code for actual behavior because the docs are brief.
