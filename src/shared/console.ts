/**
 * 共享控制台辅助函数
 *
 * 提供统一的控制台输出格式化能力，让各 demo 的控制台展示风格保持一致。
 * 包括分割线标题、JSON 打印等常用方法。
 */

/**
 * 打印带分隔线的区块标题
 * 例如：printSection("01 LLM") => "\n=== 01 LLM ==="
 */
export const printSection = (title: string) => {
  console.log(`\n=== ${title} ===`);
};

/**
 * 打印带标签的 JSON 对象
 * 将 value 序列化为格式化的 JSON 字符串（2 空格缩进）
 */
export const printJson = (label: string, value: unknown) => {
  console.log(`${label}:`, JSON.stringify(value, null, 2));
};
