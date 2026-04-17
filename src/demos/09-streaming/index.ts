/**
 * 09 Streaming Demo
 *
 * 学习目标：
 * - 理解 streaming 是前端 AI 产品里的基础体验能力，而不只是附属优化
 * - 学习 model.stream() 的最小用法，理解 token/chunk 是如何被逐步消费的
 * - 为后续扩展到 agent progress、custom updates、队列与取消控制建立直觉
 */
import { createDemoModel } from "../../shared/model";
import { printSection } from "../../shared/console";

/**
 * 从流式 chunk 中提取文本内容并拼接
 * - chunk.content 可能是字符串，也可能是更结构化的内容数组
 * - 这里做的是 token/text streaming 的最小兼容处理，便于前端按块渲染
 */
const readChunkText = (content: unknown) => {
  // 简单字符串：直接返回
  if (typeof content === "string") {
    return content;
  }

  // 非数组类型且非字符串：无法提取，返回空
  if (!Array.isArray(content)) {
    return "";
  }

  // 数组类型：遍历每个元素，提取字符串或 text 字段
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

export const runStreamingDemo = async () => {
  const model = createDemoModel();

  // 使用 stream() 替代 invoke()，逐块接收模型输出
  // 在真实前端里，这一层通常还会继续处理 loading、取消、错误恢复和消息队列
  const stream = await model.stream(
    "请模拟一个前端聊天助手的流式回复，分几小段介绍为什么流式输出能改善用户体验。"
  );

  printSection("09 Streaming");
  let aggregated = "";

  // 逐块处理并实时打印到终端
  for await (const chunk of stream) {
    const text = readChunkText(chunk.content);
    aggregated += text;
    process.stdout.write(text);
  }

  process.stdout.write("\n");
  console.log("final:", aggregated);
};
