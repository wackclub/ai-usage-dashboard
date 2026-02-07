<script lang="ts">
	import { formatNumber, formatDuration, formatRelativeTime } from '$lib/utils';

	let { data } = $props();

	let maxModelRequests = $derived(Math.max(...data.topModels.map(m => m.requestCount), 1));
</script>

<div class="space-y-8">
	<!-- Page header -->
	<div class="flex items-end justify-between animate-in">
		<div>
			<div class="flex items-center gap-3 mb-2">
				<h1 class="text-2xl font-semibold text-primary tracking-tight">System Overview</h1>
				<div class="flex items-center gap-1.5 px-2 py-0.5 bg-success/10 border border-success/30" style="border-radius: var(--radius);">
					<div class="w-1.5 h-1.5 bg-success rounded-full pulse"></div>
					<span class="text-[9px] text-success uppercase tracking-widest font-medium">Live</span>
				</div>
			</div>
			<p class="text-xs text-tertiary uppercase tracking-widest">Real-time AI API metrics across all endpoints</p>
		</div>
		<div class="text-right text-[10px] text-tertiary hidden sm:block">
			<div>Last sync: <span class="text-secondary">{formatRelativeTime(new Date())}</span></div>
		</div>
	</div>

	<!-- Primary stats row -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in delay-1">
		<div class="stat-card">
			<div class="flex items-start justify-between">
				<div>
					<div class="stat-label">Requests / 24h</div>
					<div class="stat-value text-accent">{formatNumber(data.overallStats.totalRequests)}</div>
					<div class="text-[10px] text-tertiary mt-2 flex items-center gap-1.5">
						<span class="text-accent">↑</span>
						{formatNumber(data.hourStats.requests)} this hour
					</div>
				</div>
				<div class="w-8 h-8 flex items-center justify-center border border-accent/30 bg-accent/5" style="border-radius: var(--radius);">
					<svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
				</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="flex items-start justify-between">
				<div>
					<div class="stat-label">Tokens / 24h</div>
					<div class="stat-value text-success">{formatNumber(data.overallStats.totalTokens)}</div>
					<div class="text-[10px] text-tertiary mt-2 flex items-center gap-1.5">
						<span class="text-success">↑</span>
						{formatNumber(data.hourStats.tokens)} this hour
					</div>
				</div>
				<div class="w-8 h-8 flex items-center justify-center border border-success/30 bg-success/5" style="border-radius: var(--radius);">
					<svg class="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
					</svg>
				</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="flex items-start justify-between">
				<div>
					<div class="stat-label">Active Users / 24h</div>
					<div class="stat-value text-info">{formatNumber(data.overallStats.totalUsers)}</div>
					<div class="text-[10px] text-tertiary mt-2">
						{formatNumber(data.totals.userCount)} registered total
					</div>
				</div>
				<div class="w-8 h-8 flex items-center justify-center border border-info/30 bg-info/5" style="border-radius: var(--radius);">
					<svg class="w-4 h-4 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="flex items-start justify-between">
				<div>
					<div class="stat-label">Avg Response</div>
					<div class="stat-value text-warning">{formatDuration(data.overallStats.avgDuration)}</div>
					<div class="text-[10px] text-tertiary mt-2">
						{formatNumber(data.totals.requestCount)} total requests
					</div>
				</div>
				<div class="w-8 h-8 flex items-center justify-center border border-warning/30 bg-warning/5" style="border-radius: var(--radius);">
					<svg class="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
			</div>
		</div>
	</div>

	<!-- Main content grid -->
	<div class="grid lg:grid-cols-2 gap-6 animate-in delay-2">
		<!-- Top Models -->
		<div class="card">
			<div class="flex items-center justify-between mb-6">
				<div>
					<h2 class="text-sm font-semibold text-primary tracking-wide">Model Distribution</h2>
					<p class="text-[10px] text-tertiary uppercase tracking-widest mt-0.5">Past 7 days</p>
				</div>
				<div class="text-[10px] text-tertiary">{data.topModels.length} models</div>
			</div>
			<div class="space-y-4">
				{#each data.topModels as model}
					<div class="group">
						<div class="flex justify-between items-center mb-1.5">
							<span class="text-xs text-secondary font-medium group-hover:text-accent transition-colors truncate mr-3" title={model.model}>
								{model.model.split('/').pop()}
							</span>
							<span class="text-[10px] text-tertiary tabular-nums">
								{formatNumber(model.requestCount)} req
							</span>
						</div>
						<div class="data-bar">
							<div
								class="data-bar-fill"
								style="width: {(model.requestCount / maxModelRequests) * 100}%"
							></div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Top Users -->
		<div class="card">
			<div class="flex items-center justify-between mb-6">
				<div>
					<h2 class="text-sm font-semibold text-primary tracking-wide">Top Users</h2>
					<p class="text-[10px] text-tertiary uppercase tracking-widest mt-0.5">Past 7 days</p>
				</div>
				<a href="/users" class="text-[10px] text-accent hover:text-primary transition-colors uppercase tracking-wider">View all →</a>
			</div>
			<div class="space-y-2">
				{#each data.topUsers as user, i}
					<a
						href="/users/{user.id}"
						class="flex items-center justify-between p-3 hover:bg-hover transition-all group hover:no-underline border border-transparent hover:border-default"
						style="border-radius: var(--radius);"
					>
						<div class="flex items-center gap-3">
							<div class="text-[10px] text-tertiary w-4 tabular-nums">{String(i + 1).padStart(2, '0')}</div>
							{#if user.avatar}
								<img src={user.avatar} alt="" class="w-8 h-8 border border-default" style="border-radius: var(--radius);" />
							{:else}
								<div class="w-8 h-8 bg-hover border border-default flex items-center justify-center text-secondary text-xs font-medium" style="border-radius: var(--radius);">
									{(user.name || user.email || '?').charAt(0).toUpperCase()}
								</div>
							{/if}
							<div>
								<div class="text-xs font-medium text-secondary group-hover:text-primary transition-colors flex items-center gap-2">
									{user.name || user.email || 'Unknown'}
									{#if user.isBanned}
										<span class="badge badge-danger">Banned</span>
									{/if}
								</div>
								<div class="text-[10px] text-tertiary">
									{formatNumber(user.requestCount)} requests
								</div>
							</div>
						</div>
						<div class="text-right">
							<div class="text-sm font-semibold text-success tabular-nums">{formatNumber(user.totalTokens)}</div>
							<div class="text-[9px] text-tertiary uppercase tracking-wider">tokens</div>
						</div>
					</a>
				{/each}
			</div>
		</div>
	</div>

	<!-- Recent Requests -->
	<div class="card animate-in delay-3">
		<div class="flex items-center justify-between mb-6">
			<div>
				<h2 class="text-sm font-semibold text-primary tracking-wide">Request Stream</h2>
				<p class="text-[10px] text-tertiary uppercase tracking-widest mt-0.5">Latest API calls</p>
			</div>
			<a href="/requests" class="text-[10px] text-accent hover:text-primary transition-colors uppercase tracking-wider">View all →</a>
		</div>
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>Model</th>
						<th>User</th>
						<th class="text-right">Tokens</th>
						<th class="text-right">Latency</th>
						<th class="text-right">Time</th>
					</tr>
				</thead>
				<tbody>
					{#each data.recentRequests as request}
						<tr class="group">
							<td>
								<code class="text-accent text-xs bg-accent/5 px-1.5 py-0.5 border border-accent/20" style="border-radius: var(--radius);">
									{request.model.split('/').pop()}
								</code>
							</td>
							<td>
								<a href="/users/{request.userId}" class="text-secondary hover:text-accent text-xs">
									{request.userName || 'Unknown'}
								</a>
							</td>
							<td class="text-right">
								<span class="text-success text-xs font-medium tabular-nums">{formatNumber(request.totalTokens)}</span>
								<span class="text-tertiary text-[10px] ml-1">
									({formatNumber(request.promptTokens)}+{formatNumber(request.completionTokens)})
								</span>
							</td>
							<td class="text-right">
								<span class="text-warning text-xs tabular-nums">{formatDuration(request.duration)}</span>
							</td>
							<td class="text-right text-tertiary text-[10px]">
								{formatRelativeTime(request.timestamp)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Footer stats -->
	<div class="flex flex-wrap items-center justify-center gap-6 text-[10px] text-tertiary py-4 border-t border-default animate-in delay-4">
		<div class="flex items-center gap-2">
			<div class="w-1.5 h-1.5 bg-danger"></div>
			<span><span class="text-danger font-medium">{data.totals.bannedCount}</span> banned accounts</span>
		</div>
		<div class="w-px h-3 bg-default hidden sm:block"></div>
		<div class="flex items-center gap-2">
			<div class="w-1.5 h-1.5 bg-accent"></div>
			<span><span class="text-accent font-medium">{data.topModels.length}</span> active models</span>
		</div>
		<div class="w-px h-3 bg-default hidden sm:block"></div>
		<div class="flex items-center gap-2">
			<div class="w-1.5 h-1.5 bg-success"></div>
			<span><span class="text-success font-medium">{formatNumber(data.totals.requestCount)}</span> total requests</span>
		</div>
	</div>
</div>
