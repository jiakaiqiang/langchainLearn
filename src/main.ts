/**
 * Demo 路由入口
 *
 * 通过命令行参数选择要运行的 demo，例如：
 *   pnpm dev llm        → 运行 01-llm
 *   pnpm dev tools      → 运行 05-tools
 *   pnpm dev final      → 运行 10-final-agent
 *
 * 不带参数时打印所有可用的 demo 名称和用法提示。
 */
import { runLlmDemo } from "./demos/01-llm/index";
import { runPromptDemo } from "./demos/02-prompt/index";
import { runStructuredOutputDemo } from "./demos/03-structured-output/index";
import { runChainDemo } from "./demos/04-chain/index";
import { runToolsDemo } from "./demos/05-tools/index";
import { runAgentDemo } from "./demos/06-agent/index";
import { runMemoryDemo } from "./demos/07-memory/index";
import { runRagDemo } from "./demos/08-rag/index";
import { runStreamingDemo } from "./demos/09-streaming/index";
import { runFinalAgentDemo } from "./demos/10-final-agent/index";

// demo 名称 → 执行函数的映射表
const demoMap = {
  llm: runLlmDemo,
  prompt: runPromptDemo,
  structured: runStructuredOutputDemo,
  chain: runChainDemo,
  tools: runToolsDemo,
  agent: runAgentDemo,
  memory: runMemoryDemo,
  rag: runRagDemo,
  streaming: runStreamingDemo,
  final: runFinalAgentDemo,
} as const;

// 从命令行参数获取要运行的 demo 名称
const selectedDemo = process.argv[2] as keyof typeof demoMap | undefined;

const main = async () => {
  // 未指定 demo 时，打印可用列表和用法
  if (!selectedDemo) {
    console.log("可运行 demo:", Object.keys(demoMap).join(", "));
    console.log("用法: pnpm dev <demo-name>");
    return;
  }

  // 查找对应的执行函数
  const runner = demoMap[selectedDemo];
  if (!runner) {
    console.error(`未知 demo: ${selectedDemo}`);
    process.exit(1);
  }

  // 执行选中的 demo
  await runner();
};

// 捕获未处理的错误，避免进程以未捕获异常退出
main().catch((error) => {
  console.error("demo run error:", error);
  process.exit(1);
});
