import { sql } from '$lib/server/db';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const requestId = params.id;

	const [request] = await sql`
		SELECT 
			r.id,
			r.model,
			r.prompt_tokens,
			r.completion_tokens,
			r.total_tokens,
			r.cost,
			r.request,
			r.response,
			r.timestamp,
			r.duration,
			r.ip,
			u.id as user_id,
			u.name as user_name,
			u.email as user_email
		FROM request_logs r
		JOIN users u ON r.user_id = u.id
		WHERE r.id = ${requestId}::uuid
	`;

	if (!request) {
		throw error(404, 'Request not found');
	}

	return json({
		id: request.id,
		model: request.model,
		promptTokens: Number(request.prompt_tokens),
		completionTokens: Number(request.completion_tokens),
		totalTokens: Number(request.total_tokens),
		cost: Number(request.cost || 0),
		request: request.request,
		response: request.response,
		timestamp: request.timestamp,
		duration: Number(request.duration),
		ip: request.ip,
		userId: request.user_id,
		userName: request.user_name,
		userEmail: request.user_email
	});
};
