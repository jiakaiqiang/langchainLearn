import "dotenv/config";

import { runArticleChain } from "./chains/articleChain";
import { runAssistantAgent } from "./agents/assistantAgent";
import { loadDocuments } from "./rag/loader";
import { addToVectorStore } from "./rag/vectorStore";
import { retrieveTopK } from "./rag/retriever";
import { weatherTool } from "./tools/weatherTool";
import { searchTool } from "./tools/searchTool";
import { codeTool } from "./tools/codeTool";
import { addMessage, getHistory } from "./memory/chatMemory";

async function main() {
  const topic = "LangChain.js";

  // 1) RAG: 加载 -> 入库 -> 检索
  const docs = await loadDocuments();
  addToVectorStore(docs);
  const retrieved = retrieveTopK("LangChain", 2);

  // 2) Tools: 工具调用
  const weather = await weatherTool("上海");
  const search = await searchTool("LangChain.js 教程");
  const code = await codeTool("生成一个 hello world 示例");

  // 3) Chain
  addMessage({ role: "user", content: `请介绍：${topic}` });
  const chainResp = await runArticleChain(topic);
  addMessage({ role: "assistant", content: String(chainResp.content) });

  // 4) Agent
  addMessage({ role: "user", content: "请从 Agent 角度再总结一次" });
  const agentResp = await runAssistantAgent("LangChain Agent 入门");
  addMessage({ role: "assistant", content: String(agentResp.content) });

  console.log("\n=== RAG 检索结果 ===");
  console.log(retrieved);

  console.log("\n=== Tools 结果 ===");
  console.log({ weather, search, code });

  console.log("\n=== Chain 输出 ===");
  console.log(chainResp.content);

  console.log("\n=== Agent 输出 ===");
  console.log(agentResp.content);

  console.log("\n=== Memory 历史 ===");
  console.log(getHistory());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
