import * as client from "openid-client";
import { OIDC_CLIENT_ID, OIDC_CLIENT_SECRET } from "$env/static/private";
import { dev } from "$app/environment";

const issuer = new URL("https://auth.mahadk.com");
export const redirect_uri = dev
  ? "http://localhost:5173/auth/callback"
  : "https://nightwatch.mahadk.com/auth/callback";

let _config: client.Configuration;

export async function getAuthConfig() {
  if (_config) return _config;

  _config = await client.discovery(issuer, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET);

  return _config;
}
