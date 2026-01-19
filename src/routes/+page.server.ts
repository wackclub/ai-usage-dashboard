import { sql } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Get overall stats
	const [overallStats] = await sql`
		SELECT 
			COUNT(*) as total_requests,
			COUNT(DISTINCT user_id) as total_users,
			SUM(total_tokens) as total_tokens,
			AVG(duration)::integer as avg_duration
		FROM request_logs
		WHERE timestamp > NOW() - INTERVAL '24 hours'
	`;

	// Get stats for last hour for comparison
	const [hourStats] = await sql`
		SELECT 
			COUNT(*) as requests,
			SUM(total_tokens) as tokens
		FROM request_logs
		WHERE timestamp > NOW() - INTERVAL '1 hour'
	`;

	// Get top models (last 7 days)
	const topModels = await sql`
		SELECT 
			model,
			COUNT(*) as request_count,
			SUM(total_tokens) as total_tokens
		FROM request_logs
		WHERE timestamp > NOW() - INTERVAL '7 days'
		GROUP BY model
		ORDER BY request_count DESC
		LIMIT 10
	`;

	// Get top users (last 7 days)
	const topUsers = await sql`
		SELECT 
			u.id,
			u.name,
			u.email,
			u.avatar,
			u.is_banned,
			COUNT(*) as request_count,
			SUM(r.total_tokens) as total_tokens
		FROM request_logs r
		JOIN users u ON r.user_id = u.id
		WHERE r.timestamp > NOW() - INTERVAL '7 days'
		GROUP BY u.id, u.name, u.email, u.avatar, u.is_banned
		ORDER BY request_count DESC
		LIMIT 10
	`;

	// Get recent requests
	const recentRequests = await sql`
		SELECT 
			r.id,
			r.model,
			r.total_tokens,
			r.prompt_tokens,
			r.completion_tokens,
			r.timestamp,
			r.duration,
			u.name as user_name,
			u.id as user_id
		FROM request_logs r
		JOIN users u ON r.user_id = u.id
		ORDER BY r.timestamp DESC
		LIMIT 10
	`;

	// Get hourly request counts for last 24 hours
	const hourlyActivity = await sql`
		SELECT 
			date_trunc('hour', timestamp) as hour,
			COUNT(*) as count,
			SUM(total_tokens) as tokens
		FROM request_logs
		WHERE timestamp > NOW() - INTERVAL '24 hours'
		GROUP BY date_trunc('hour', timestamp)
		ORDER BY hour ASC
	`;

	// Get total counts
	const [totals] = await sql`
		SELECT 
			(SELECT COUNT(*) FROM users) as user_count,
			(SELECT COUNT(*) FROM request_logs) as request_count,
			(SELECT COUNT(*) FROM users WHERE is_banned = true) as banned_count
	`;

	return {
		overallStats: {
			totalRequests: Number(overallStats.total_requests) || 0,
			totalUsers: Number(overallStats.total_users) || 0,
			totalTokens: Number(overallStats.total_tokens) || 0,
			avgDuration: Number(overallStats.avg_duration) || 0
		},
		hourStats: {
			requests: Number(hourStats.requests) || 0,
			tokens: Number(hourStats.tokens) || 0
		},
		topModels: topModels.map(m => ({
			model: m.model,
			requestCount: Number(m.request_count),
			totalTokens: Number(m.total_tokens)
		})),
		topUsers: topUsers.map(u => ({
			id: u.id,
			name: u.name,
			email: u.email,
			avatar: u.avatar,
			isBanned: u.is_banned,
			requestCount: Number(u.request_count),
			totalTokens: Number(u.total_tokens)
		})),
		recentRequests: recentRequests.map(r => ({
			id: r.id,
			model: r.model,
			totalTokens: Number(r.total_tokens),
			promptTokens: Number(r.prompt_tokens),
			completionTokens: Number(r.completion_tokens),
			timestamp: r.timestamp,
			duration: Number(r.duration),
			userName: r.user_name,
			userId: r.user_id
		})),
		hourlyActivity: hourlyActivity.map(h => ({
			hour: h.hour,
			count: Number(h.count),
			tokens: Number(h.tokens)
		})),
		totals: {
			userCount: Number(totals.user_count),
			requestCount: Number(totals.request_count),
			bannedCount: Number(totals.banned_count)
		}
	};
};
