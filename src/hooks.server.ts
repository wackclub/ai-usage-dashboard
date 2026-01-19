import { redirect, type Handle } from '@sveltejs/kit';
import * as client from 'openid-client';
import { getAuthConfig, redirect_uri } from '$lib/server/auth';
import { dev } from '$app/environment';

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	// Allow auth routes and internal SvelteKit routes
	if (
		pathname.startsWith('/auth') ||
		pathname.startsWith('/_app') ||
		pathname === '/favicon.ico' ||
		pathname.startsWith('/static') // Just in case
	) {
		return resolve(event);
	}

	// Check if user is authenticated
	const accessToken = event.cookies.get('access_token');

	if (accessToken) {
		// Populate locals.user
		// In a real world scenario, you might decode the token or fetch user info
		event.locals.user = { authenticated: true };
		return resolve(event);
	}

	// Not authenticated, start OIDC flow
	const config = await getAuthConfig();
	
	const code_verifier = client.randomPKCECodeVerifier();
	const code_challenge = await client.calculatePKCECodeChallenge(code_verifier);
	const state = client.randomState();

	// Store state and verifier in httpOnly cookies
	// secure: !dev ensures it works on localhost (http) but enforces https in prod
	const cookieOptions = {
		path: '/',
		httpOnly: true,
		secure: !dev, 
		sameSite: 'lax' as const,
		maxAge: 600 // 10 minutes
	};

	event.cookies.set('pkce_verifier', code_verifier, cookieOptions);
	event.cookies.set('state', state, cookieOptions);

	const parameters = {
		redirect_uri,
		scope: 'openid profile email',
		code_challenge,
		code_challenge_method: 'S256',
		state
	};

	const redirectTo = client.buildAuthorizationUrl(config, parameters);

	throw redirect(302, redirectTo.href);
};
