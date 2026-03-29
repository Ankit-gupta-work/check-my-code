import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Invalid JSON");
  }
}

export async function analyzeCode(code) {
  const response = await client.chat.completions.create({
    model: "openai/gpt-4o-mini",
    max_tokens: 1000,
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `You are a senior software engineer who reviews code.

Return strictly valid JSON in this exact format:

{
  "language": "javascript|python|typescript|etc",
  "summary": "Brief 1-2 sentence summary of code quality",
  "quality": "Excellent|Good|Fair|Poor",
  "score": 1-10,
  "issues": [
    {
      "title": "Issue name",
      "description": "Detailed explanation",
      "severity": "critical|high|medium|low",
      "fix": "Suggested fix"
    }
  ],
  "strengths": ["strength 1", "strength 2"],
  "suggestions": ["suggestion 1", "suggestion 2"]
}

Return MAX 5 issues only. Always include strengths and suggestions.`,
      },
      {
        role: "user",
        content: code,
      },
    ],
  });

  return safeParseJSON(response.choices[0].message.content);
}