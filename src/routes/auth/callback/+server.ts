import { redirect } from '@sveltejs/kit';
import * as client from 'openid-client';
import { getAuthConfig, redirect_uri } from '$lib/server/auth';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code_verifier = cookies.get('pkce_verifier');
	const expectedState = cookies.get('state');

	if (!code_verifier || !expectedState) {
		// If cookies are missing, the flow is broken or expired.
		// Redirect to home to restart flow.
		console.error('Missing PKCE verifier or state cookie in callback');
		throw redirect(302, '/');
	}

	const config = await getAuthConfig();

	try {
		const tokens = await client.authorizationCodeGrant(
			config,
			url,
			{
				pkceCodeVerifier: code_verifier,
				expectedState,
				idTokenExpected: true
			},
			{
				redirect_uri
			}
		);

		// Clear PKCE cookies
		cookies.delete('pkce_verifier', { path: '/' });
		cookies.delete('state', { path: '/' });

		// Set session cookie
		cookies.set('access_token', tokens.access_token, {
			path: '/',
			httpOnly: true,
			secure: !dev,
			sameSite: 'lax',
			maxAge: tokens.expires_in || 3600
		});

		// You might also want to set id_token or refresh_token depending on needs

	} catch (e) {
		console.error('Auth Callback Error:', e);
		throw redirect(302, '/?error=auth_failed');
	}

	throw redirect(302, '/');
};
