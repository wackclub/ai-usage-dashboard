import { redirect } from '@sveltejs/kit';
import * as client from 'openid-client';
import { getAuthConfig } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, url }) => {
	// Check if we are already coming back from IDP logout
	if (url.searchParams.get('logged_out') === 'true') {
		// Clean up and go home
		cookies.delete('access_token', { path: '/' });
		cookies.delete('pkce_verifier', { path: '/' });
		cookies.delete('state', { path: '/' });
		throw redirect(302, '/');
	}

	// We are initiating logout
	const config = await getAuthConfig();
	
	// Clear local session
	cookies.delete('access_token', { path: '/' });
	cookies.delete('pkce_verifier', { path: '/' });
	cookies.delete('state', { path: '/' });

	const postLogoutRedirectUri = `${url.origin}/auth/logout?logged_out=true`;

	try {
		const endSessionUrl = client.buildEndSessionUrl(config, {
			post_logout_redirect_uri: postLogoutRedirectUri
		});
		throw redirect(302, endSessionUrl.href);
	} catch (e) {
		// Fallback if end_session_endpoint is not supported or other error
		console.warn('Could not build end session URL:', e);
		throw redirect(302, '/');
	}
};
