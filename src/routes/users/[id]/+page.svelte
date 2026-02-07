<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { formatNumber, formatDuration, formatRelativeTime, formatDate, truncate } from '$lib/utils';

	let { data } = $props();

	let selectedPeriod = $state('day');

	const periods = [
		{ value: 'day', label: '24h' },
		{ value: '2days', label: '2d' },
		{ value: '7days', label: '7d' },
		{ value: '30days', label: '30d' },
		{ value: 'all', label: 'All' }
	];

	let currentStats = $derived(data.usageByPeriod[selectedPeriod] || {
		requestCount: 0,
		totalTokens: 0,
		promptTokens: 0,
		completionTokens: 0,
		avgDuration: 0
	});

	let isUpdating = $state(false);

	async function toggleStatus(field: 'is_banned' | 'skip_idv', currentValue: boolean) {
		isUpdating = true;
		try {
			const response = await fetch(`/users/${data.user.id}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: field, value: !currentValue })
			});
			if (response.ok) {
				await invalidateAll();
			}
		} catch (error) {
			console.error('Failed to update user:', error);
		} finally {
			isUpdating = false;
		}
	}

	const maxModelRequests = $derived(Math.max(...data.modelBreakdown.map(m => m.requestCount), 1));
</script>

<div class="space-y-6">
	<!-- Back button and header -->
	<div class="flex items-start justify-between gap-4 animate-in">
		<div class="flex items-start gap-4">
			<a 
				href="/users" 
				class="mt-1 w-10 h-10 flex items-center justify-center border border-default hover:border-accent hover:text-accent transition-all hover:no-underline"
				style="border-radius: var(--radius);"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19l-7-7 7-7" />
				</svg>
			</a>
			<div class="flex items-center gap-4">
				{#if data.user.avatar}
					<img src={data.user.avatar} alt="" class="w-16 h-16 border border-default" style="border-radius: var(--radius);" />
				{:else}
					<div class="w-16 h-16 bg-hover border border-default flex items-center justify-center text-secondary text-2xl font-medium" style="border-radius: var(--radius);">
						{(data.user.name || data.user.email || '?').charAt(0).toUpperCase()}
					</div>
				{/if}
				<div>
					<h1 class="text-2xl font-semibold text-primary tracking-tight">{data.user.name || 'Unknown'}</h1>
					<p class="text-xs text-tertiary">{data.user.email || data.user.slackId}</p>
					<div class="flex items-center gap-2 mt-2">
						{#if data.user.isBanned}
							<span class="badge badge-danger">Banned</span>
						{/if}
						{#if data.user.isIdvVerified}
							<span class="badge badge-success">Verified</span>
						{/if}
						{#if data.user.skipIdv}
							<span class="badge badge-purple">IDV Bypass</span>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Action buttons -->
		<div class="flex gap-2">
			<button
				class="btn {data.user.skipIdv ? 'btn-secondary' : 'btn-primary'}"
				onclick={() => toggleStatus('skip_idv', data.user.skipIdv)}
				disabled={isUpdating}
			>
				{#if isUpdating}
					<span class="spinner"></span>
				{/if}
				{data.user.skipIdv ? 'Remove Bypass' : 'Bypass IDV'}
			</button>
			<button
				class="btn {data.user.isBanned ? 'btn-success' : 'btn-danger'}"
				onclick={() => toggleStatus('is_banned', data.user.isBanned)}
				disabled={isUpdating}
			>
				{#if isUpdating}
					<span class="spinner"></span>
				{/if}
				{data.user.isBanned ? 'Unban' : 'Ban User'}
			</button>
		</div>
	</div>

	<!-- User info card -->
	<div class="card animate-in delay-1">
		<h2 class="text-[10px] font-semibold text-tertiary uppercase tracking-widest mb-4">Account Details</h2>
		<div class="grid grid-cols-2 md:grid-cols-4 gap-6">
			<div>
				<div class="text-[9px] text-tertiary uppercase tracking-widest mb-1">Slack ID</div>
				<code class="text-xs text-secondary bg-hover px-2 py-0.5" style="border-radius: var(--radius);">{data.user.slackId}</code>
			</div>
			<div>
				<div class="text-[9px] text-tertiary uppercase tracking-widest mb-1">User ID</div>
				<code class="text-xs text-secondary bg-hover px-2 py-0.5" style="border-radius: var(--radius);">{data.user.id.slice(0, 12)}...</code>
			</div>
			<div>
				<div class="text-[9px] text-tertiary uppercase tracking-widest mb-1">Created</div>
				<div class="text-xs text-secondary">{formatDate(data.user.createdAt)}</div>
			</div>
			<div>
				<div class="text-[9px] text-tertiary uppercase tracking-widest mb-1">Last Updated</div>
				<div class="text-xs text-secondary">{formatRelativeTime(data.user.updatedAt)}</div>
			</div>
		</div>
	</div>

	<!-- Usage Summary with Period Tabs -->
	<div class="card animate-in delay-2">
		<div class="flex items-center justify-between mb-6">
			<h2 class="text-[10px] font-semibold text-tertiary uppercase tracking-widest">Usage Metrics</h2>
			<div class="flex">
				{#each periods as period, i}
					<button
						class="px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium transition-all border-y border-r first:border-l {selectedPeriod === period.value
							? 'bg-accent text-primary border-accent'
							: 'bg-transparent text-tertiary border-default hover:text-secondary'}"
						style="border-radius: {i === 0 ? 'var(--radius) 0 0 var(--radius)' : i === periods.length - 1 ? '0 var(--radius) var(--radius) 0' : '0'};"
						onclick={() => selectedPeriod = period.value}
					>
						{period.label}
					</button>
				{/each}
			</div>
		</div>

		<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
			<div class="stat-card">
				<div class="stat-value text-accent">{formatNumber(currentStats.requestCount)}</div>
				<div class="stat-label">Requests</div>
			</div>
			<div class="stat-card">
				<div class="stat-value text-success">{formatNumber(currentStats.totalTokens)}</div>
				<div class="stat-label">Total Tokens</div>
			</div>
			<div class="stat-card">
				<div class="stat-value text-accent">{formatNumber(currentStats.promptTokens)}</div>
				<div class="stat-label">Prompt</div>
			</div>
			<div class="stat-card">
				<div class="stat-value text-info">{formatNumber(currentStats.completionTokens)}</div>
				<div class="stat-label">Completion</div>
			</div>
			<div class="stat-card">
				<div class="stat-value text-warning">{formatDuration(currentStats.avgDuration)}</div>
				<div class="stat-label">Avg Latency</div>
			</div>
		</div>
	</div>

	<!-- Model breakdown and API keys row -->
	<div class="grid lg:grid-cols-2 gap-6 animate-in delay-3">
		<!-- Model Breakdown -->
		<div class="card">
			<h2 class="text-[10px] font-semibold text-tertiary uppercase tracking-widest mb-4">Model Usage</h2>
			{#if data.modelBreakdown.length > 0}
				<div class="space-y-4">
					{#each data.modelBreakdown as model}
						<div class="group">
							<div class="flex justify-between items-center mb-1.5">
								<span class="text-xs text-secondary font-medium group-hover:text-accent transition-colors truncate mr-3" title={model.model}>
									{model.model.split('/').pop()}
								</span>
								<span class="text-[10px] text-tertiary tabular-nums">
									{formatNumber(model.requestCount)} req · {formatNumber(model.totalTokens)} tok
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
			{:else}
				<div class="text-center py-8">
					<svg class="w-10 h-10 mx-auto mb-3 text-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
					</svg>
					<p class="text-xs text-tertiary uppercase tracking-wider">No requests yet</p>
				</div>
			{/if}
		</div>

		<!-- API Keys -->
		<div class="card">
			<h2 class="text-[10px] font-semibold text-tertiary uppercase tracking-widest mb-4">API Keys</h2>
			{#if data.apiKeys.length > 0}
				<div class="space-y-2">
					{#each data.apiKeys as key}
						<div class="flex items-center justify-between p-3 bg-tertiary border border-default" style="border-radius: var(--radius);">
							<div>
								<div class="font-medium text-secondary text-xs">{key.name}</div>
								<code class="text-[10px] text-tertiary">{key.keyPreview}...</code>
							</div>
							<div class="text-right">
								{#if key.revokedAt}
									<span class="badge badge-danger">Revoked</span>
								{:else}
									<span class="badge badge-success">Active</span>
								{/if}
								<div class="text-[9px] text-tertiary mt-1">{formatRelativeTime(key.createdAt)}</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center py-8">
					<svg class="w-10 h-10 mx-auto mb-3 text-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
					</svg>
					<p class="text-xs text-tertiary uppercase tracking-wider">No API keys</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Recent Requests -->
	<div class="card animate-in delay-4">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-[10px] font-semibold text-tertiary uppercase tracking-widest">Recent Activity</h2>
			<a 
				href="/requests?user={data.user.id}" 
				class="text-[10px] text-accent hover:text-primary transition-colors uppercase tracking-wider"
			>
				View all →
			</a>
		</div>

		{#if data.recentRequests.length > 0}
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>Model</th>
							<th class="text-right">Tokens</th>
							<th class="text-right">Latency</th>
							<th class="text-right">Time</th>
							<th>Preview</th>
						</tr>
					</thead>
					<tbody>
						{#each data.recentRequests as request}
							<tr>
								<td>
									<code class="text-accent text-[11px] bg-accent/5 px-1.5 py-0.5 border border-accent/20" style="border-radius: var(--radius);">
										{request.model.split('/').pop()}
									</code>
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
								<td class="text-right text-tertiary text-[10px] whitespace-nowrap">
									{formatRelativeTime(request.timestamp)}
								</td>
								<td class="max-w-[200px]">
									<span class="text-tertiary text-[11px] truncate block">
										{truncate(request.requestPreview, 40)}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="text-center py-12">
				<svg class="w-12 h-12 mx-auto mb-4 text-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
				<p class="text-xs text-tertiary uppercase tracking-wider">No requests recorded</p>
			</div>
		{/if}
	</div>
</div>
