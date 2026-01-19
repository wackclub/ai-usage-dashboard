<script lang="ts">
	import { formatNumber, formatDuration, formatRelativeTime } from '$lib/utils';

	let { data } = $props();

	// Calculate max for chart scaling
	const maxModelRequests = Math.max(...data.topModels.map(m => m.requestCount), 1);
</script>

<div class="space-y-6">
	<!-- Page header -->
	<div>
		<h1 class="text-2xl font-bold text-nord6">Dashboard</h1>
		<p class="text-nord4 text-sm mt-1">Overview of AI API usage across all users</p>
	</div>

	<!-- Stats cards -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="stat-card">
			<div class="stat-label">Requests (24h)</div>
			<div class="stat-value text-nord8">{formatNumber(data.overallStats.totalRequests)}</div>
			<div class="text-xs text-nord4 mt-1">
				{formatNumber(data.hourStats.requests)} in last hour
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-label">Tokens (24h)</div>
			<div class="stat-value text-nord14">{formatNumber(data.overallStats.totalTokens)}</div>
			<div class="text-xs text-nord4 mt-1">
				{formatNumber(data.hourStats.tokens)} in last hour
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-label">Active Users (24h)</div>
			<div class="stat-value text-nord15">{formatNumber(data.overallStats.totalUsers)}</div>
			<div class="text-xs text-nord4 mt-1">
				{formatNumber(data.totals.userCount)} total users
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-label">Avg Response Time</div>
			<div class="stat-value text-nord13">{formatDuration(data.overallStats.avgDuration)}</div>
			<div class="text-xs text-nord4 mt-1">
				{formatNumber(data.totals.requestCount)} total requests
			</div>
		</div>
	</div>

	<!-- Charts row -->
	<div class="grid lg:grid-cols-2 gap-6">
		<!-- Top Models -->
		<div class="card">
			<h2 class="text-lg font-semibold text-nord6 mb-4">Top Models (7 days)</h2>
			<div class="space-y-3">
				{#each data.topModels as model}
					<div>
						<div class="flex justify-between text-sm mb-1">
							<span class="text-nord4 truncate mr-2" title={model.model}>
								{model.model.split('/').pop()}
							</span>
							<span class="text-nord5 whitespace-nowrap">
								{formatNumber(model.requestCount)} req
							</span>
						</div>
						<div class="h-2 bg-nord2 rounded-full overflow-hidden">
							<div
								class="h-full bg-gradient-to-r from-nord10 to-nord8 rounded-full transition-all"
								style="width: {(model.requestCount / maxModelRequests) * 100}%"
							></div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Top Users -->
		<div class="card">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold text-nord6">Top Users (7 days)</h2>
				<a href="/users" class="text-xs text-nord8 hover:text-nord7">View all</a>
			</div>
			<div class="space-y-2">
				{#each data.topUsers as user}
					<a
						href="/users/{user.id}"
						class="flex items-center justify-between p-2 rounded-lg hover:bg-nord2 transition-colors hover:no-underline"
					>
						<div class="flex items-center gap-3">
							{#if user.avatar}
								<img src={user.avatar} alt="" class="w-8 h-8 rounded-full" />
							{:else}
								<div class="w-8 h-8 rounded-full bg-nord3 flex items-center justify-center text-nord5 text-sm font-medium">
									{(user.name || user.email || '?').charAt(0).toUpperCase()}
								</div>
							{/if}
							<div>
								<div class="text-sm font-medium text-nord5 flex items-center gap-2">
									{user.name || user.email || 'Unknown'}
									{#if user.isBanned}
										<span class="badge badge-danger">Banned</span>
									{/if}
								</div>
								<div class="text-xs text-nord4">
									{formatNumber(user.requestCount)} requests
								</div>
							</div>
						</div>
						<div class="text-right">
							<div class="text-sm font-medium text-nord8">{formatNumber(user.totalTokens)}</div>
							<div class="text-xs text-nord4">tokens</div>
						</div>
					</a>
				{/each}
			</div>
		</div>
	</div>

	<!-- Recent Requests -->
	<div class="card">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-semibold text-nord6">Recent Requests</h2>
			<a href="/requests" class="text-xs text-nord8 hover:text-nord7">View all</a>
		</div>
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>Model</th>
						<th>User</th>
						<th class="text-right">Tokens</th>
						<th class="text-right">Duration</th>
						<th class="text-right">Time</th>
					</tr>
				</thead>
				<tbody>
					{#each data.recentRequests as request}
						<tr>
							<td>
								<span class="text-nord8 font-mono text-xs">
									{request.model.split('/').pop()}
								</span>
							</td>
							<td>
								<a href="/users/{request.userId}" class="text-nord4 hover:text-nord8">
									{request.userName || 'Unknown'}
								</a>
							</td>
							<td class="text-right">
								<span class="text-nord14">{formatNumber(request.totalTokens)}</span>
								<span class="text-nord4 text-xs ml-1">
									({formatNumber(request.promptTokens)}+{formatNumber(request.completionTokens)})
								</span>
							</td>
							<td class="text-right text-nord13">
								{formatDuration(request.duration)}
							</td>
							<td class="text-right text-nord4 text-xs">
								{formatRelativeTime(request.timestamp)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Quick Stats Footer -->
	<div class="flex items-center justify-center gap-8 text-sm text-nord4 py-4">
		<div>
			<span class="text-nord11">{data.totals.bannedCount}</span> banned users
		</div>
		<div>
			<span class="text-nord5">{data.topModels.length}</span> models in use
		</div>
	</div>
</div>
