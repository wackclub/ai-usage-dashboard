import { sql } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search') || '';
	const filter = url.searchParams.get('filter') || 'all'; // all, banned, verified, skip_idv
	const sortBy = url.searchParams.get('sort') || 'requests';
	const sortOrder = url.searchParams.get('order') || 'desc';
	const timePeriod = url.searchParams.get('period') || 'all'; // all, 24h, 1w, 1m
	const page = parseInt(url.searchParams.get('page') || '1') || 1;
	const perPage = 25;
	const offset = (page - 1) * perPage;

	// Time period filter for stats
	let timeFilter = '';
	if (timePeriod === '24h') {
		timeFilter = "AND timestamp >= NOW() - INTERVAL '24 hours'";
	} else if (timePeriod === '1w') {
		timeFilter = "AND timestamp >= NOW() - INTERVAL '7 days'";
	} else if (timePeriod === '1m') {
		timeFilter = "AND timestamp >= NOW() - INTERVAL '30 days'";
	}

	// Build conditions
	const conditions: string[] = [];
	const params: string[] = [];
	let paramIndex = 1;

	// Search filter
	if (search) {
		conditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.slack_id ILIKE $${paramIndex})`);
		params.push(`%${search}%`);
		paramIndex++;
	}

	// Status filter
	if (filter === 'banned') {
		conditions.push('u.is_banned = true');
	} else if (filter === 'verified') {
		conditions.push('u.is_idv_verified = true');
	} else if (filter === 'skip_idv') {
		conditions.push('u.skip_idv = true');
	} else if (filter === 'unverified') {
		conditions.push('u.is_idv_verified = false AND u.skip_idv = false');
	}

	const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

	// Validate sort column
	let orderBy: string;
	switch (sortBy) {
		case 'name':
			orderBy = 'u.name';
			break;
		case 'tokens':
			orderBy = 'total_tokens';
			break;
		case 'cost':
			orderBy = 'total_cost';
			break;
		case 'created':
			orderBy = 'u.created_at';
			break;
		case 'requests':
		default:
			orderBy = 'request_count';
	}
	const order = sortOrder === 'asc' ? 'ASC NULLS LAST' : 'DESC NULLS LAST';

	// Count query
	const countQuery = `
		SELECT COUNT(*) as count
		FROM users u
		${whereClause}
	`;

	// Users with stats query
	const dataQuery = `
		SELECT 
			u.id,
			u.slack_id,
			u.email,
			u.name,
			u.avatar,
			u.created_at,
			u.is_idv_verified,
			u.skip_idv,
			u.is_banned,
			COALESCE(stats.request_count, 0) as request_count,
			COALESCE(stats.total_tokens, 0) as total_tokens,
			COALESCE(stats.total_cost, 0) as total_cost,
			COALESCE(stats.last_request, u.created_at) as last_request
		FROM users u
		LEFT JOIN (
			SELECT 
				user_id,
				COUNT(*) as request_count,
				SUM(total_tokens) as total_tokens,
				SUM(cost) as total_cost,
				MAX(timestamp) as last_request
			FROM request_logs
			WHERE 1=1 ${timeFilter}
			GROUP BY user_id
		) stats ON u.id = stats.user_id
		${whereClause}
		ORDER BY ${orderBy} ${order}
		LIMIT ${perPage} OFFSET ${offset}
	`;

	const [countResult] = await sql.unsafe(countQuery, params);
	const users = await sql.unsafe(dataQuery, params);

	const totalCount = Number(countResult.count);
	const totalPages = Math.ceil(totalCount / perPage);

	// Get filter counts
	const [filterCounts] = await sql`
		SELECT
			COUNT(*) as total,
			COUNT(*) FILTER (WHERE is_banned = true) as banned,
			COUNT(*) FILTER (WHERE is_idv_verified = true) as verified,
			COUNT(*) FILTER (WHERE skip_idv = true) as skip_idv,
			COUNT(*) FILTER (WHERE is_idv_verified = false AND skip_idv = false) as unverified
		FROM users
	`;

	return {
		users: users.map(u => ({
			id: u.id,
			slackId: u.slack_id,
			email: u.email,
			name: u.name,
			avatar: u.avatar,
			createdAt: u.created_at,
			isIdvVerified: u.is_idv_verified,
			skipIdv: u.skip_idv,
			isBanned: u.is_banned,
			requestCount: Number(u.request_count),
			totalTokens: Number(u.total_tokens),
			totalCost: Number(u.total_cost),
			lastRequest: u.last_request
		})),
		filters: {
			search,
			filter,
			sortBy,
			sortOrder,
			timePeriod
		},
		pagination: {
			page,
			perPage,
			totalCount,
			totalPages
		},
		filterCounts: {
			total: Number(filterCounts.total),
			banned: Number(filterCounts.banned),
			verified: Number(filterCounts.verified),
			skipIdv: Number(filterCounts.skip_idv),
			unverified: Number(filterCounts.unverified)
		}
	};
};
