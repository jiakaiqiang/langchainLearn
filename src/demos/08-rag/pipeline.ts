import { createDemoModel } from "../../shared/model";
import { printJson, printSection } from "../../shared/console";

type RawDocument = {
  id: string;
  title: string;
  source: string;
  updatedAt: string;
  content: string;
};

type ChunkDocument = {
  id: string;
  docId: string;
  title: string;
  source: string;
  updatedAt: string;
  chunkIndex: number;
  content: string;
};

type VectorRecord = ChunkDocument & {
  embedding: number[];
};

type RetrievalHit = ChunkDocument & {
  score: number;
  vectorScore: number;
  keywordScore: number;
};

const rawDocuments: RawDocument[] = [
  {
    id: "doc-table",
    title: "Table 组件规范",
    source: "frontend-design-system",
    updatedAt: "2026-04-17",
    content:
      "Table 适合展示结构化列表数据。设计时先确定 columns、rowKey、分页、排序、筛选、loading、空态和批量操作。对用户来说，重点不是表格本身，而是能否快速比较数据、定位异常记录，并在高密度信息里保持可扫读。",
  },
  {
    id: "doc-modal",
    title: "Modal 交互规范",
    source: "frontend-design-system",
    updatedAt: "2026-04-17",
    content:
      "Modal 适合承载确认、编辑、详情和危险操作确认。实现时要明确 open 状态、关闭回调、焦点管理、遮罩点击行为、表单提交和异步 loading。对复杂任务来说，Modal 更适合短流程，不适合长内容和重浏览。",
  },
  {
    id: "doc-form",
    title: "Form 体验规范",
    source: "frontend-design-system",
    updatedAt: "2026-04-17",
    content:
      "Form 适合输入、校验、提交和字段联动。设计时要考虑默认值、错误提示、禁用状态、提交反馈、字段依赖和长表单分组。好的表单不是字段堆叠，而是减少用户思考成本，让校验在输入过程中尽早暴露。",
  },
];

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const makeSearchTerms = (text: string) => {
  const tokens = tokenize(text);
  const terms = [...tokens];

  for (const token of tokens) {
    if (/[\u4e00-\u9fff]/u.test(token)) {
      for (let index = 0; index < token.length - 1; index += 1) {
        terms.push(token.slice(index, index + 2));
      }
    }
  }

  return terms;
};

const hashToken = (token: string, dimension: number) => {
  let hash = 0;
  for (let index = 0; index < token.length; index += 1) {
    hash = (hash * 31 + token.charCodeAt(index)) >>> 0;
  }
  return hash % dimension;
};

const embedText = (text: string, dimension = 32) => {
  const vector = new Array(dimension).fill(0);
  const tokens = makeSearchTerms(text);

  for (const token of tokens) {
    vector[hashToken(token, dimension)] += 1;
  }

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return norm > 0 ? vector.map((value) => value / norm) : vector;
};

const cosineSimilarity = (left: number[], right: number[]) => {
  const length = Math.min(left.length, right.length);
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] * left[index];
    rightNorm += right[index] * right[index];
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
};

const keywordOverlapScore = (query: string, text: string) => {
  const queryTerms = new Set(makeSearchTerms(query));
  const textTerms = new Set(makeSearchTerms(text));
  if (!queryTerms.size) {
    return 0;
  }

  let matched = 0;
  for (const term of queryTerms) {
    if (textTerms.has(term)) {
      matched += 1;
    }
  }

  return matched / queryTerms.size;
};

const splitIntoChunks = (document: RawDocument, chunkSize = 80, overlap = 20) => {
  const chunks: ChunkDocument[] = [];
  const text = document.content.replace(/\s+/g, " ").trim();
  let start = 0;
  let chunkIndex = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const content = text.slice(start, end).trim();

    if (content) {
      chunks.push({
        id: `${document.id}-chunk-${chunkIndex + 1}`,
        docId: document.id,
        title: document.title,
        source: document.source,
        updatedAt: document.updatedAt,
        chunkIndex: chunkIndex + 1,
        content,
      });
    }

    if (end >= text.length) {
      break;
    }

    start = Math.max(end - overlap, start + 1);
    chunkIndex += 1;
  }

  return chunks;
};

class MockVectorStore {
  private records: VectorRecord[] = [];

  upsert(chunks: ChunkDocument[]) {
    this.records = chunks.map((chunk) => ({
      ...chunk,
      embedding: embedText(`${chunk.title} ${chunk.content}`),
    }));
  }

  query(text: string, topK = 3) {
    const queryEmbedding = embedText(text);

    return this.records
      .map((record) => {
        const vectorScore = cosineSimilarity(queryEmbedding, record.embedding);
        const keywordScore = keywordOverlapScore(text, `${record.title} ${record.content}`);

        return {
          ...record,
          vectorScore,
          keywordScore,
          score: vectorScore * 0.2 + keywordScore * 0.8,
        };
      })
      .filter((record) => record.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, topK);
  }
}

const buildIngestionCorpus = () => {
  const chunks = rawDocuments.flatMap((document) => splitIntoChunks(document));
  return { rawDocuments, chunks };
};

const validateRetrieval = (query: string, hits: RetrievalHit[]) => {
  if (!hits.length) {
    return {
      passed: false,
      reason: "没有召回任何片段",
      query,
    };
  }

  const topHit = hits[0];
  const secondHit = hits[1];
  const overlapRatio = keywordOverlapScore(query, `${topHit.title} ${topHit.content}`);
  const passed = topHit.score >= 0.2 && overlapRatio >= 0.25;

  return {
    passed,
    reason: passed ? "召回结果与问题匹配" : "召回结果命中但相关性偏弱",
    topHit: {
      id: topHit.id,
      title: topHit.title,
      score: Number(topHit.score.toFixed(3)),
      vectorScore: Number(topHit.vectorScore.toFixed(3)),
      keywordScore: Number(topHit.keywordScore.toFixed(3)),
    },
    overlapRatio: Number(overlapRatio.toFixed(3)),
    scoreGap: secondHit ? Number((topHit.score - secondHit.score).toFixed(3)) : null,
  };
};

const buildPrompt = (query: string, hits: RetrievalHit[]) => {
  const context = hits
    .map(
      (hit, index) =>
        `[#${index + 1}] ${hit.title} (source=${hit.source}, chunk=${hit.chunkIndex}, score=${hit.score.toFixed(3)})\n${hit.content}`
    )
    .join("\n\n");

  return [
    "你是一个前端知识库问答助手。",
    "只能依据给定上下文回答，不要编造。",
    `问题：${query}`,
    `上下文：\n${context || "无"}`,
    "回答要求：先给结论，再给简短依据，并说明引用了哪些片段。",
  ].join("\n\n");
};

const synthesizeAnswer = (query: string, hits: RetrievalHit[]) => {
  if (!hits.length) {
    return `没有召回到与「${query}」相关的知识片段。`;
  }

  const top = hits[0];
  return `结论：${top.title} 最相关，适合回答「${query}」。依据：${top.content}`;
};

export async function runRagDemo() {
  const query = "Table 适合什么场景";
  const corpus = buildIngestionCorpus();
  const store = new MockVectorStore();
  store.upsert(corpus.chunks);

  const retrieved = store.query(query, 3);
  const validation = validateRetrieval(query, retrieved);
  const prompt = buildPrompt(query, retrieved);

  let answer = synthesizeAnswer(query, retrieved);

  try {
    const model = createDemoModel();
    const response = await model.invoke(prompt);
    answer = String(response.content ?? answer);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("模型不可用，使用兜底答案:", message);
  }

  printSection("08 RAG Pipeline MVP");
  printJson("ingestion", {
    rawDocuments: corpus.rawDocuments.map((doc) => ({
      id: doc.id,
      title: doc.title,
      source: doc.source,
    })),
    chunkCount: corpus.chunks.length,
  });
  printJson(
    "chunks",
    corpus.chunks.map((chunk) => ({
      id: chunk.id,
      docId: chunk.docId,
      chunkIndex: chunk.chunkIndex,
      preview: chunk.content.slice(0, 80),
    }))
  );
  printJson(
    "retrieved",
    retrieved.map((hit) => ({
      id: hit.id,
      title: hit.title,
      chunkIndex: hit.chunkIndex,
      score: Number(hit.score.toFixed(3)),
      vectorScore: Number(hit.vectorScore.toFixed(3)),
      keywordScore: Number(hit.keywordScore.toFixed(3)),
    }))
  );
  printJson("validation", validation);
  console.log("prompt:\n" + prompt);
  console.log("answer:", answer);
}
