import { ToolMessage } from "@langchain/core/messages";
import { ChatModel } from "./learn/llm/model";
import { getWeather } from "./learn/tools/getWeathre";
import { customAgent } from "./learn/memeory/langMemeory";
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
// let agent = customAgent();
// agent.invoke({messages:[{role:"system",content:"你是一个贾凯强的私人助手，擅长天气的查询"},{role:"user",content:[{type:"text",text:"西安的天气怎么样"}]}],},{context:{userName:"贾凯强"}}).then((res)=>{
//     console.log("agent res:",res);
// }).catch((err)=>{
//     console.error("agent err:",err);
// });Save the following user: userid: abc123, name: Foo, age: 25, email: foo@langchain.dev
//lang memory
const result = async () => {
  const agent = customAgent();

  const saveData = await agent.invoke(
    {
      messages: [
        {
          role: "system",
          content:
            "你是一个用户信息管理助手，必须通过工具来保存和读取用户信息，不能自己虚构存储结果。",
        },
        {
          role: "user",
          content:
            "请帮我保存用户信息：userid:123abc, name:贾凯强, age:18, gender:男",
        },
      ],
    },
    { context: { userName: "贾凯强" } }
  );

  console.log("saveData:", saveData);

  const getData = await agent.invoke({
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "请根据用户id:123abc 获取用户信息" },
        ],
      },
    ],
  });

  console.log("getData:", getData);
};

result();
