import { sql } from '$lib/server/db';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params }) => {
	const keyId = params.id;

	try {
		await sql`
			UPDATE api_keys 
			SET revoked_at = NOW() 
			WHERE id = ${keyId}::uuid
		`;
		
		return json({ success: true });
	} catch (e) {
		console.error('Failed to revoke API key:', e);
		throw error(500, 'Failed to revoke API key');
	}
};
