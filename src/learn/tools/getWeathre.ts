import { tool } from "langchain";
import * as z from "zod";

export const getWeather = tool(
  async (input) => `${input.location} 的天气总是晴朗！`,
  {
    name: "get_weather",
    description: "查询指定城市的天气",
    schema: z.object({
      location: z.string().describe("查询天气的城市名称"),
    }),
  }
);
