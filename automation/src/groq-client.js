function getBaseUrl(env) {
  return env?.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
}

function getApiKey(env) {
  return env?.GROQ_API_KEY ?? "";
}

async function requestJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Groq request failed (${response.status}): ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

export function createGroqClient(env) {
  const apiKey = getApiKey(env);
  const baseUrl = getBaseUrl(env);
  const model = env?.GROQ_MODEL ?? "llama-3.3-70b-versatile";

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is required");
  }

  async function chat(messages, options = {}) {
    return requestJson(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 3000,
        ...options,
        messages,
      }),
    });
  }

  return {
    async generateText({ system, user, responseFormat = null }) {
      const payload = {
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      };

      if (responseFormat) {
        payload.response_format = responseFormat;
      }

      const result = await chat(payload.messages, payload);
      return result?.choices?.[0]?.message?.content ?? "";
    },
    async generateJson({ system, user }) {
      const text = await this.generateText({
        system,
        user,
        responseFormat: { type: "json_object" },
      });

      return JSON.parse(text);
    },
  };
}
