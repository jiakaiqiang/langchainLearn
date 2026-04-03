import { ChatOllama } from "@langchain/ollama";
import "dotenv/config";
import { getWeather } from "../../learn/tools/getWeathre";

const modelInter = new ChatOllama({
  model: "qwen3.5:cloud",
  temperature: 0,
});

export const ChatModel = () => {
  return modelInter.bindTools([getWeather]);
};



  