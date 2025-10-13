"use client";
import { useState } from "react";

export default function ChatWorkflow() {
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + process.env.NEXT_PUBLIC_OPENAI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.NEXT_PUBLIC_WORKFLOW_ID,
          messages: [...messages, userMsg],
        }),
      });

      const data = await res.json();
      const reply = data.choices[0]?.message?.content || "No response";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      alert("Error: " + err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Workflow Chat</h1>
      <div className="border rounded p-4 h-96 overflow-y-auto mb-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-blue-600" : "text-green-600"}>
            <strong>{m.role}:</strong> {m.content}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === "Enter" && send()}
        className="border p-2 w-full"
        disabled={loading}
      />
      <button onClick={send} disabled={loading} className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
        {loading ? "..." : "Send"}
      </button>
    </div>
  );
}

