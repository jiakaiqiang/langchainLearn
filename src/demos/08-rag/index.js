import { runRagDemo } from "./pipeline.ts";

runRagDemo().catch((error) => {
  console.error("rag js demo error:", error);
  process.exit(1);
});
