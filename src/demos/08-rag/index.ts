/**
 * 08 Retrieval / RAG Basics Demo
 *
 * 学习目标：
 * - 理解 retrieval 的基本心智模型：先找资料，再基于资料回答
 * - 学习本地文档检索的最小实现，理解它与完整 RAG 的关系
 * - 知道真实场景通常会继续扩展到 embeddings、vector store、retriever
 */
import { printJson, printSection } from "../../shared/console";

// 定义文档类型
type DemoDocument = {
  id: string;
  title: string;
  content: string;
};

// 模拟一组可被检索的领域资料；真实项目里这些内容通常来自知识库或业务文档
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
  {
    id: "doc-3",
    title: "Form 体验规范",
    content: "Form 适合处理输入、校验和提交，需要注意字段联动、错误提示和提交禁用态。",
  },
];

// 教学版 retrieval：这里只做关键词匹配；生产环境通常会升级到向量检索或 retriever
const retrieveDocs = (query: string, topK = 2) => {
  return documents
    .filter((doc) => doc.content.includes(query) || doc.title.includes(query))
    .slice(0, topK);
};

export const runRagDemo = async () => {
  const query = "Table";

  // 第一步：先取回和问题相关的资料
  const retrieved = retrieveDocs(query);

  // 第二步：基于检索结果组织回答；这里故意保持最小实现，方便理解 retrieval → answer 的连接
  const answer = retrieved.length
    ? `根据检索到的文档，${retrieved[0].content}`
    : "没有找到相关文档。";

  printSection("08 RAG");
  console.log("query:", query);
  printJson("retrieved", retrieved);
  console.log("answer:", answer);
};
