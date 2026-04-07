import { tool,ToolRuntime } from "langchain";
import * as z from "zod";

export const getWeather = tool(
  async (input,config:ToolRuntime) =>{
    const writer =  config.writer
     if (writer) {
      writer(`Looking up data for city: ${input.location}`);
      writer(`Acquired data for city: ${input.location}`);
    }
    console.log(config.context,input,'上下文配置数据')
    return  `${input.location} 的天气总是晴朗！`
  },
  {
    name: "get_weather",
    description: "查询指定城市的天气",
    schema: z.object({
      location: z.string().describe("查询天气的城市名称"),
    }),
  }
);
