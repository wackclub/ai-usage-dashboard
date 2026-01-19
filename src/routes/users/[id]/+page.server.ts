import { sql } from '$lib/server/db';
import { error, json } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const userId = params.id;

	// Get user info
	const [user] = await sql`
		SELECT * FROM users WHERE id = ${userId}::uuid
	`;

	if (!user) {
		throw error(404, 'User not found');
	}

	// Get usage stats for different time periods
	const usageStats = await sql`
		SELECT 
			'day' as period,
			COUNT(*) as request_count,
			COALESCE(SUM(total_tokens), 0) as total_tokens,
			COALESCE(SUM(prompt_tokens), 0) as prompt_tokens,
			COALESCE(SUM(completion_tokens), 0) as completion_tokens,
			COALESCE(AVG(duration), 0)::integer as avg_duration
		FROM request_logs
		WHERE user_id = ${userId}::uuid AND timestamp > NOW() - INTERVAL '1 day'
		UNION ALL
		SELECT 
			'2days' as period,
			COUNT(*) as request_count,
			COALESCE(SUM(total_tokens), 0) as total_tokens,
			COALESCE(SUM(prompt_tokens), 0) as prompt_tokens,
			COALESCE(SUM(completion_tokens), 0) as completion_tokens,
			COALESCE(AVG(duration), 0)::integer as avg_duration
		FROM request_logs
		WHERE user_id = ${userId}::uuid AND timestamp > NOW() - INTERVAL '2 days'
		UNION ALL
		SELECT 
			'7days' as period,
			COUNT(*) as request_count,
			COALESCE(SUM(total_tokens), 0) as total_tokens,
			COALESCE(SUM(prompt_tokens), 0) as prompt_tokens,
			COALESCE(SUM(completion_tokens), 0) as completion_tokens,
			COALESCE(AVG(duration), 0)::integer as avg_duration
		FROM request_logs
		WHERE user_id = ${userId}::uuid AND timestamp > NOW() - INTERVAL '7 days'
		UNION ALL
		SELECT 
			'30days' as period,
			COUNT(*) as request_count,
			COALESCE(SUM(total_tokens), 0) as total_tokens,
			COALESCE(SUM(prompt_tokens), 0) as prompt_tokens,
			COALESCE(SUM(completion_tokens), 0) as completion_tokens,
			COALESCE(AVG(duration), 0)::integer as avg_duration
		FROM request_logs
		WHERE user_id = ${userId}::uuid AND timestamp > NOW() - INTERVAL '30 days'
		UNION ALL
		SELECT 
			'all' as period,
			COUNT(*) as request_count,
			COALESCE(SUM(total_tokens), 0) as total_tokens,
			COALESCE(SUM(prompt_tokens), 0) as prompt_tokens,
			COALESCE(SUM(completion_tokens), 0) as completion_tokens,
			COALESCE(AVG(duration), 0)::integer as avg_duration
		FROM request_logs
		WHERE user_id = ${userId}::uuid
	`;

	// Get model breakdown (all time)
	const modelBreakdown = await sql`
		SELECT 
			model,
			COUNT(*) as request_count,
			SUM(total_tokens) as total_tokens
		FROM request_logs
		WHERE user_id = ${userId}::uuid
		GROUP BY model
		ORDER BY request_count DESC
		LIMIT 10
	`;

	// Get recent requests
	const recentRequests = await sql`
		SELECT 
			id,
			model,
			prompt_tokens,
			completion_tokens,
			total_tokens,
			timestamp,
			duration,
			LEFT(request, 200) as request_preview
		FROM request_logs
		WHERE user_id = ${userId}::uuid
		ORDER BY timestamp DESC
		LIMIT 20
	`;

	// Get API keys
	const apiKeys = await sql`
		SELECT 
			id,
			name,
			LEFT(key, 12) as key_preview,
			created_at,
			revoked_at
		FROM api_keys
		WHERE user_id = ${userId}::uuid
		ORDER BY created_at DESC
	`;

	// Convert usage stats to a map
	const usageByPeriod: Record<string, {
		requestCount: number;
		totalTokens: number;
		promptTokens: number;
		completionTokens: number;
		avgDuration: number;
	}> = {};

	for (const stat of usageStats) {
		usageByPeriod[stat.period] = {
			requestCount: Number(stat.request_count),
			totalTokens: Number(stat.total_tokens),
			promptTokens: Number(stat.prompt_tokens),
			completionTokens: Number(stat.completion_tokens),
			avgDuration: Number(stat.avg_duration)
		};
	}

	return {
		user: {
			id: user.id,
			slackId: user.slack_id,
			email: user.email,
			name: user.name,
			avatar: user.avatar,
			createdAt: user.created_at,
			updatedAt: user.updated_at,
			isIdvVerified: user.is_idv_verified,
			skipIdv: user.skip_idv,
			isBanned: user.is_banned
		},
		usageByPeriod,
		modelBreakdown: modelBreakdown.map(m => ({
			model: m.model,
			requestCount: Number(m.request_count),
			totalTokens: Number(m.total_tokens)
		})),
		recentRequests: recentRequests.map(r => ({
			id: r.id,
			model: r.model,
			promptTokens: Number(r.prompt_tokens),
			completionTokens: Number(r.completion_tokens),
			totalTokens: Number(r.total_tokens),
			timestamp: r.timestamp,
			duration: Number(r.duration),
			requestPreview: r.request_preview
		})),
		apiKeys: apiKeys.map(k => ({
			id: k.id,
			name: k.name,
			keyPreview: k.key_preview,
			createdAt: k.created_at,
			revokedAt: k.revoked_at
		}))
	};
};

export const actions: Actions = {
	default: async ({ request, params }) => {
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
		}

		return { success: true };
	}
};
