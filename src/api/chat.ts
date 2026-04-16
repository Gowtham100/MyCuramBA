export async function sendMessage(payload: unknown): Promise<string> {
  const res = await fetch("http://localhost:3001/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload }),
  })

  if (!res.ok) {
    throw new Error("Failed to send message")
  }

  const data = await res.json()
  return data.output
}