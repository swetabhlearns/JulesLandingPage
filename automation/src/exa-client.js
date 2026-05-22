function getBaseUrl(env) {
  return env?.EXA_BASE_URL ?? "https://api.exa.ai";
}

function getApiKey(env) {
  return env?.EXA_API_KEY ?? "";
}

async function requestJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Exa request failed (${response.status}): ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

export function createExaClient(env) {
  const apiKey = getApiKey(env);
  const baseUrl = getBaseUrl(env);

  if (!apiKey) {
    throw new Error("EXA_API_KEY is required");
  }

  async function post(path, body) {
    return requestJson(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });
  }

  return {
    search(body) {
      return post("/search", {
        type: "auto",
        text: true,
        numResults: 8,
        ...body,
      });
    },
    contents(body) {
      return post("/contents", body);
    },
    research(body) {
      return post("/research", body);
    },
  };
}
