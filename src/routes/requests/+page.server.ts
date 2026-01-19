import { sql } from '$lib/server/db';
import { getTimeFilterInterval } from '$lib/utils';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search') || '';
	const timeFilter = url.searchParams.get('time') || 'day';
	const model = url.searchParams.get('model') || '';
	const userId = url.searchParams.get('user') || '';
	const minTokens = parseInt(url.searchParams.get('minTokens') || '0') || 0;
	const maxTokens = parseInt(url.searchParams.get('maxTokens') || '0') || 0;
	const sortBy = url.searchParams.get('sort') || 'timestamp';
	const sortOrder = url.searchParams.get('order') || 'desc';
	const page = parseInt(url.searchParams.get('page') || '1') || 1;
	const includeBanned = url.searchParams.get('includeBanned') === 'true';
	const perPage = 50;
	const offset = (page - 1) * perPage;

	const timeInterval = getTimeFilterInterval(timeFilter);

	// Build dynamic query conditions
	const conditions: string[] = [];
	const params: (string | number)[] = [];
	let paramIndex = 1;

	// Exclude banned users by default
	if (!includeBanned) {
		conditions.push('u.is_banned = false');
	}

	// Time filter
	if (timeFilter !== 'all') {
		conditions.push(`r.timestamp > NOW() - INTERVAL '${timeInterval}'`);
	}

	// Model filter
	if (model) {
		conditions.push(`r.model = $${paramIndex}`);
		params.push(model);
		paramIndex++;
	}

	// User filter
	if (userId) {
		conditions.push(`r.user_id = $${paramIndex}::uuid`);
		params.push(userId);
		paramIndex++;
	}

	// Token filters
	if (minTokens > 0) {
		conditions.push(`r.total_tokens >= $${paramIndex}`);
		params.push(minTokens);
		paramIndex++;
	}
	if (maxTokens > 0) {
		conditions.push(`r.total_tokens <= $${paramIndex}`);
		params.push(maxTokens);
		paramIndex++;
	}

	// Search filter (fuzzy search on model, request, response)
	if (search) {
		conditions.push(`(
			r.model ILIKE $${paramIndex} OR
			r.request ILIKE $${paramIndex} OR
			r.response ILIKE $${paramIndex}
		)`);
		params.push(`%${search}%`);
		paramIndex++;
	}

	const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

	// Validate sort column
	const validSortColumns = ['timestamp', 'total_tokens', 'prompt_tokens', 'completion_tokens', 'duration', 'model', 'cost'];
	const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'timestamp';
	const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

	// Get total count
	const countQuery = `
		SELECT COUNT(*) as count
		FROM request_logs r
		JOIN users u ON r.user_id = u.id
		${whereClause}
	`;

	// Get requests with user info - only fetch truncated preview for list view
	const dataQuery = `
		SELECT 
			r.id,
			r.model,
			r.prompt_tokens,
			r.completion_tokens,
			r.total_tokens,
			r.cost,
			LEFT(r.request, 200) as request_preview,
			r.timestamp,
			r.duration,
			r.ip,
			u.id as user_id,
			u.name as user_name,
			u.email as user_email,
			u.avatar as user_avatar
		FROM request_logs r
		JOIN users u ON r.user_id = u.id
		${whereClause}
		ORDER BY r.${sortColumn} ${order}
		LIMIT ${perPage} OFFSET ${offset}
	`;

	// Execute queries
	const [countResult] = await sql.unsafe(countQuery, params);
	const requests = await sql.unsafe(dataQuery, params);

	// Get distinct models for filter dropdown
	const models = await sql`
		SELECT DISTINCT model FROM request_logs ORDER BY model
	`;

	// Get users for filter dropdown (limited for performance)
	const users = await sql`
		SELECT id, name, email 
		FROM users 
		ORDER BY name NULLS LAST 
		LIMIT 100
	`;

	const totalCount = Number(countResult.count);
	const totalPages = Math.ceil(totalCount / perPage);

	return {
		requests: requests.map(r => ({
			id: r.id,
			model: r.model,
			promptTokens: Number(r.prompt_tokens),
			completionTokens: Number(r.completion_tokens),
			totalTokens: Number(r.total_tokens),
			cost: Number(r.cost || 0),
			requestPreview: r.request_preview,
			timestamp: r.timestamp,
			duration: Number(r.duration),
			ip: r.ip,
			userId: r.user_id,
			userName: r.user_name,
			userEmail: r.user_email,
			userAvatar: r.user_avatar
		})),
		filters: {
			search,
			timeFilter,
			model,
			userId,
			minTokens,
			maxTokens,
			sortBy,
			sortOrder,
			includeBanned
		},
		pagination: {
			page,
			perPage,
			totalCount,
			totalPages
		},
		models: models.map(m => m.model),
		users: users.map(u => ({
			id: u.id,
			name: u.name,
			email: u.email
		}))
	};
};
