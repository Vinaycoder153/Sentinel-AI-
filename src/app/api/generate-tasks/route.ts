import { NextRequest, NextResponse } from 'next/server';

// 🔒 In-memory rate limiting (use Redis/Upstash in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;

  entry.count++;
  return true;
}

// ✅ Safer JSON extraction
function extractJSON(text: string) {
  try {
    // Attempt direct parse
    return JSON.parse(text);
  } catch {
    // Strip markdown code blocks if present
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      // Regex fallback to find the first { and last }
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch (e) {
          throw new Error("Failed to parse JSON even after cleaning");
        }
      }
      throw new Error("No valid JSON structure found in AI response");
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again in 1 minute.' }, { status: 429 });
    }

    const { goal, energy, time, streak, completionRate } = await request.json();

    if (!goal || !energy || !time) {
      return NextResponse.json({ error: 'Missing goal, energy, or time.' }, { status: 400 });
    }

    const contextLines = [];
    if (streak) contextLines.push(`- Streak: ${streak} days`);
    if (completionRate) contextLines.push(`- Rate: ${completionRate}%`);

    const prompt = `You are an elite execution-focused AI assistant and startup growth strategist.

🎯 Primary Goal:
Help the user generate income quickly while building a scalable startup through high-impact daily actions.

🧠 INPUT CONTEXT:
- Primary Goal: "${goal}"
- Energy level: ${energy}
- Available time: ${time}
${contextLines.length > 0 ? `\nPast Performance & Context:\n${contextLines.join('\n')}\n` : ''}

⚡ TASK GENERATION RULES:
Generate EXACTLY 3 tasks (one for each category below):

1. 💰 Money Task (Direct revenue generation: outreach, sales, proposals, paid work)
2. 🚀 Startup Task (Concrete building: product features, UI, core ops)
3. 📈 Growth Task (Skill improvement or marketing: acquisition, learning, distribution)

🧠 ADAPTIVE LOGIC:
- 🔥 High Energy: Focus on "Deep Work" (coding, closing deals, complex building).
- ⚡ Medium Energy: Focus on "Moderate Tasks" (UI work, learning, distribution).
- 💤 Low Energy: Focus on "Admin/Light Tasks" (research, planning, follow-ups).

📊 PERFORMANCE ADJUSTMENT:
- If streak/rate is low: Reduce task granularity to ensure completion (smaller wins).
- If streak/rate is high: Increase task impact and difficulty.

⚠️ CONSTRAINTS:
- No generic advice. Use specific action verbs.
- Tasks must be executable within ${time}.
- Format: Return ONLY a valid JSON object.

📦 OUTPUT FORMAT:
{
  "tasks": [
    { "title": "Specific, measurable money-making action", "type": "Money", "urgency": "Critical" },
    { "title": "Concrete startup building/execution task", "type": "Startup", "urgency": "High" },
    { "title": "Short, skill-focused growth task", "type": "Growth", "urgency": "Medium" }
  ]
}`;

    // 🚀 Using OpenRouter (OpenAI-compatible)
    const apiKey = process.env.GEMINI_API_KEY;
    const model = "google/gemini-2.0-flash-001"; // Preferred OpenRouter ID

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000", // Required by OpenRouter
          "X-Title": "Execution OS",
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }, // OpenRouter supports JSON mode
          temperature: 0.7,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error?.message || `HTTP ${response.status}`;
        console.error("OpenRouter Error:", errorMsg);
        return NextResponse.json({ error: errorMsg }, { status: response.status });
      }

      const aiContent = data.choices?.[0]?.message?.content;
      if (!aiContent) throw new Error("Empty response from AI");

      const parsedData = extractJSON(aiContent);
      if (parsedData?.tasks) {
        return NextResponse.json(parsedData);
      }

      throw new Error("Invalid task structure from AI");

    } catch (err: any) {
      console.error("Fetch Error:", err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

  } catch (error: any) {
    console.error("AI Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}