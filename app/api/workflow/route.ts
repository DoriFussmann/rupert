import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  const workflowId = process.env.WORKFLOW_ID;
  
  if (!apiKey || !workflowId) {
    return NextResponse.json({ error: "Config missing" }, { status: 500 });
  }

  const { message } = await req.json();
  
  if (!message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: workflowId,
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || "Failed" }, { status: res.status });
    }

    const reply = data.choices[0]?.message?.content || "No response";
    return NextResponse.json({ message: reply });
    
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

