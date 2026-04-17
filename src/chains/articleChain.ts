// 此文件已废弃，功能已迁移到 src/demos/04-chain/index.ts
// 新版 chain demo 使用 Runnable 序列，不再依赖旧版 model 工厂
export async function runArticleChain(_topic: string): Promise<{ content: string }> {
  throw new Error(
    "旧版 articleChain 已废弃，请使用 pnpm dev chain 运行新版 demo"
  );
}
