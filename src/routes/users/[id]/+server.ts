import { sql } from '$lib/server/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, params }) => {
	const userId = params.id;
	const data = await request.json();
	const { action, value } = data;

	if (action === 'is_banned') {
		await sql`
			UPDATE users 
			SET is_banned = ${value}, updated_at = NOW() 
			WHERE id = ${userId}::uuid
		`;
	} else if (action === 'skip_idv') {
		await sql`
			UPDATE users 
			SET skip_idv = ${value}, updated_at = NOW() 
			WHERE id = ${userId}::uuid
		`;
	} else {
		return json({ error: 'Invalid action' }, { status: 400 });
	}

	return json({ success: true });
};
