import { ToolMessage } from "@langchain/core/messages";
import { ChatModel } from "./learn/llm/model";
import { getWeather } from "./learn/tools/getWeathre";
import { customAgent } from "./learn/agents/assistantAgent";
//聊天助手
// const model = ChatModel();

// const messageList = [{ role: "user", content: "西安的天气怎么样" }];

// const toolsByName = {
//   [getWeather.name]: getWeather,
// };

// const message = async () => {
//   const firstResponse = await model.invoke(messageList);
//   console.log("firstResponse:", firstResponse);

//   if (!firstResponse.tool_calls?.length) {
//     console.log(firstResponse.content);
//     return;
//   }

//   const toolMessages = await Promise.all(
//     firstResponse.tool_calls.map(async (toolCall) => {
//       const tool = toolsByName[toolCall.name as keyof typeof toolsByName];

//       if (!tool) {
//         throw new Error(`未找到工具: ${toolCall.name}`);
//       }

//       const toolResult = await tool.invoke(toolCall.args);

//       return new ToolMessage({
//         tool_call_id: toolCall.id ?? "",
//         content:
//           typeof toolResult === "string"
//             ? toolResult
//             : JSON.stringify(toolResult),
//       });
//     })
//   );
//  //使用流式输出
//   const finalResponse = await model.invoke([
//     ...messageList,
//     firstResponse,
//     ...toolMessages,
//   ]);
//   console.log("finalResponse:", finalResponse);

// };

// message().catch(console.error);

//agent 
let agent = customAgent([getWeather]);
agent.invoke({messages:[{role:"user",content:"西安的天气怎么样"}]}).then((res)=>{
    console.log("agent res:",res);
}).catch((err)=>{
    console.error("agent err:",err);
});