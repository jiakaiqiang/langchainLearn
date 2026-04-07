//长记忆存储
import { createAgent, tool } from "langchain";
import { ChatOllama } from "@langchain/ollama";
import { InMemoryStore } from "@langchain/langgraph";
import * as z from "zod";

// 创建存储实例
const store = new InMemoryStore();

// 创建模型实例
const modelInter = new ChatOllama({
  model: "qwen3.5:cloud",
});

// 存储用户的信息
const saveUserInfo = tool(
  async ({ user_id, name, age, gender }) => {
    console.log(">>> saveUserInfo called with:", { user_id, name, age, gender });
    await store.put(["user_info"], user_id, { name, age, gender });
    return "successly saveD";
  },
  {
    name: "save_user_info",
    description: "保存用户信息",
    schema: z.object({
      user_id: z.string().describe("用户id"),
      name: z.string().describe("用户名"),
      age: z.coerce.number().describe("年龄"),
      gender: z.string().describe("性别"),
    }),
  }
);

// 获取用户的信息
const getUserInfo = tool(
  async ({ user_id }) => {
    console.log(">>> getUserInfo called with:", { user_id });
    const userInfo = await store.get(["user_info"], user_id);
    return userInfo;
  },
  {
    name: "get_user_info",
    description: "获取用户信息",
    schema: z.object({
      user_id: z.string().describe("用户id"),
    }),
  }
);

export const customAgent = () => {
  return createAgent({
    model: modelInter,
    tools: [saveUserInfo, getUserInfo],
    store,
  });
};
