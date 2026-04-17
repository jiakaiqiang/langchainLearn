// 此文件已废弃，功能已迁移到 src/demos/06-agent/index.ts
// 新版 agent demo 使用 createAgent + tools 模式，不再转发到 chain
export async function runAssistantAgent(_input: string) {
  throw new Error(
    "旧版 assistantAgent 已废弃，请使用 pnpm dev agent 运行新版 demo"
  );
}
