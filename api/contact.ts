type ContactSubmission = {
  fullName: string;
  email: string;
  subject: string;
  message: string;
  botField?: string;
};

type ZohoTokenResponse = {
  access_token: string;
  api_domain: string;
  expires_in: number;
  token_type: string;
};

let cachedAccessToken = "";
let cachedAccessTokenExpiresAt = 0;
let cachedApiDomain = "https://www.zohoapis.com";

function getZohoConfig() {
  const missingVars = [
    "ZOHO_CRM_CLIENT_ID",
    "ZOHO_CRM_CLIENT_SECRET",
    "ZOHO_CRM_REFRESH_TOKEN",
  ].filter((name) => !process.env[name]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`);
  }

  return {
    accountsBaseUrl: process.env.ZOHO_ACCOUNTS_BASE_URL ?? "https://accounts.zoho.com",
    clientId: process.env.ZOHO_CRM_CLIENT_ID as string,
    clientSecret: process.env.ZOHO_CRM_CLIENT_SECRET as string,
    refreshToken: process.env.ZOHO_CRM_REFRESH_TOKEN as string,
    leadSource: process.env.ZOHO_CRM_LEAD_SOURCE?.trim() || "",
  };
}

function parseFullName(fullName: string) {
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  const parts = trimmed.split(" ");

  if (parts.length === 1) {
    return {
      firstName: "",
      lastName: parts[0],
    };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1] ?? parts[0],
  };
}

async function getZohoAccessToken() {
  if (cachedAccessToken && Date.now() < cachedAccessTokenExpiresAt - 60_000) {
    return {
      accessToken: cachedAccessToken,
      apiDomain: cachedApiDomain,
    };
  }

  const { accountsBaseUrl, clientId, clientSecret, refreshToken } = getZohoConfig();

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const response = await fetch(`${accountsBaseUrl}/oauth/v2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`Zoho token refresh failed with status ${response.status}: ${responseText}`);
  }

  let token: Partial<ZohoTokenResponse> | null = null;

  try {
    token = JSON.parse(responseText) as Partial<ZohoTokenResponse>;
  } catch {
    throw new Error(`Zoho token refresh returned non-JSON response: ${responseText}`);
  }

  if (!token.access_token || !token.api_domain) {
    throw new Error(`Zoho token refresh returned an invalid response: ${responseText}`);
  }

  cachedAccessToken = token.access_token;
  cachedApiDomain = token.api_domain;
  cachedAccessTokenExpiresAt = Date.now() + token.expires_in * 1000;

  return {
    accessToken: cachedAccessToken,
    apiDomain: cachedApiDomain,
  };
}

async function createZohoContact(submission: ContactSubmission) {
  const { accessToken, apiDomain } = await getZohoAccessToken();
  const { firstName, lastName } = parseFullName(submission.fullName);
  const { leadSource } = getZohoConfig();

  const payload = {
    data: [
      {
        First_Name: firstName || undefined,
        Last_Name: lastName,
        Email: submission.email,
        Description: [
          `Subject: ${submission.subject}`,
          "",
          submission.message,
        ].join("\n"),
        ...(leadSource ? { Lead_Source: leadSource } : {}),
      },
    ],
  };

  const response = await fetch(`${apiDomain}/crm/v8/Contacts`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const details = json?.message || json?.error || `Zoho CRM returned status ${response.status}`;
    throw new Error(details);
  }

  return json;
}

export default {
  async fetch(request: Request) {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          Allow: "POST",
        },
      });
    }

    try {
      const contentType = request.headers.get("content-type") || "";
      let submission: ContactSubmission;

      if (contentType.includes("application/json")) {
        submission = (await request.json()) as ContactSubmission;
      } else {
        const formData = await request.formData();
        submission = {
          fullName: String(formData.get("full_name") ?? "").trim(),
          email: String(formData.get("email") ?? "").trim(),
          subject: String(formData.get("subject") ?? "").trim(),
          message: String(formData.get("message") ?? "").trim(),
          botField: String(formData.get("bot_field") ?? "").trim(),
        };
      }

      if (submission.botField) {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      if (!submission.fullName || !submission.email || !submission.subject || !submission.message) {
        return new Response(JSON.stringify({ ok: false, error: "Please complete all required fields." }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      await createZohoContact(submission);

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Contact form submission failed:", error);
      const message = error instanceof Error ? error.message : "Unable to submit contact form.";
      return new Response(JSON.stringify({ ok: false, error: message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  },
};
