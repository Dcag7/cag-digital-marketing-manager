import 'server-only';

interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

function getLLMConfig(): LLMConfig {
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.LLM_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    throw new Error('LLM_API_KEY is not set');
  }

  return { apiKey, baseUrl, model };
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callLLM(
  messages: LLMMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const config = getLLMConfig();
  const { apiKey, baseUrl, model } = config;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

export async function callLLMJson<T>(
  messages: LLMMessage[],
  schema?: object
): Promise<T> {
  const systemMessage: LLMMessage = {
    role: 'system',
    content: schema
      ? `You must respond with valid JSON matching this schema: ${JSON.stringify(schema)}. Return only the JSON object, no markdown, no code blocks.`
      : 'You must respond with valid JSON only. Return only the JSON object, no markdown, no code blocks.',
  };

  const response = await callLLM([systemMessage, ...messages], {
    temperature: 0.3,
    maxTokens: 4000,
  });

  // Try to extract JSON from response
  let jsonStr = response.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch (error) {
    throw new Error(`Failed to parse LLM JSON response: ${error}`);
  }
}
