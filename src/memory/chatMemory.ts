type Message = { role: "user" | "assistant"; content: string };

const history: Message[] = [];

export function addMessage(message: Message) {
  history.push(message);
}

export function getHistory() {
  return history;
}
