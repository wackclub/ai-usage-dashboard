import * as client from "openid-client";
import { env } from "$env/static/private";
import { dev } from "$app/environment";

const issuer = new URL("https://auth.mahadk.com");
export const redirect_uri = dev
  ? "http://localhost:5173/auth/callback"
  : "https://nightwatch.mahadk.com/auth/callback";

let _config: client.Configuration;

export async function getAuthConfig() {
  if (_config) return _config;

  if (!env.OIDC_CLIENT_ID || !env.OIDC_CLIENT_SECRET) {
    throw new Error(
      "Missing OIDC_CLIENT_ID or OIDC_CLIENT_SECRET in environment variables",
    );
  }

  _config = await client.discovery(
    issuer,
    env.OIDC_CLIENT_ID,
    env.OIDC_CLIENT_SECRET,
  );

  return _config;
}
