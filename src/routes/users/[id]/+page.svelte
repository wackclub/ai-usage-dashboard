<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { formatNumber, formatDuration, formatRelativeTime, formatDate, truncate } from '$lib/utils';

	let { data } = $props();

	let selectedPeriod = $state('day');

	const periods = [
		{ value: 'day', label: '24 Hours' },
		{ value: '2days', label: '2 Days' },
		{ value: '7days', label: '7 Days' },
		{ value: '30days', label: '30 Days' },
		{ value: 'all', label: 'All Time' }
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
	<div class="flex items-start justify-between gap-4">
		<div class="flex items-start gap-4">
			<a 
				href="/users" 
				class="mt-1 p-2 rounded-lg bg-nord2 hover:bg-nord3 transition-colors hover:no-underline"
			>
				<svg class="w-5 h-5 text-nord4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
			</a>
			<div class="flex items-center gap-4">
				{#if data.user.avatar}
					<img src={data.user.avatar} alt="" class="w-16 h-16 rounded-full" />
				{:else}
					<div class="w-16 h-16 rounded-full bg-nord3 flex items-center justify-center text-nord5 text-2xl font-medium">
						{(data.user.name || data.user.email || '?').charAt(0).toUpperCase()}
					</div>
				{/if}
				<div>
					<h1 class="text-2xl font-bold text-nord6">{data.user.name || 'Unknown'}</h1>
					<p class="text-nord4 text-sm">{data.user.email || data.user.slackId}</p>
					<div class="flex items-center gap-2 mt-2">
						{#if data.user.isBanned}
							<span class="badge badge-danger">Banned</span>
						{/if}
						{#if data.user.isIdvVerified}
							<span class="badge badge-success">IDV Verified</span>
						{/if}
						{#if data.user.skipIdv}
							<span class="badge badge-purple">Skip IDV</span>
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
					<span class="spinner mr-2"></span>
				{/if}
				{data.user.skipIdv ? 'Remove IDV Bypass' : 'Bypass IDV'}
			</button>
			<button
				class="btn {data.user.isBanned ? 'btn-success' : 'btn-danger'}"
				onclick={() => toggleStatus('is_banned', data.user.isBanned)}
				disabled={isUpdating}
			>
				{#if isUpdating}
					<span class="spinner mr-2"></span>
				{/if}
				{data.user.isBanned ? 'Unban User' : 'Ban User'}
			</button>
		</div>
	</div>

	<!-- User info card -->
	<div class="card">
		<h2 class="text-sm font-semibold text-nord5 uppercase tracking-wide mb-4">User Details</h2>
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<div>
				<div class="text-xs text-nord4 uppercase">Slack ID</div>
				<div class="text-sm text-nord5 font-mono">{data.user.slackId}</div>
			</div>
			<div>
				<div class="text-xs text-nord4 uppercase">User ID</div>
				<div class="text-sm text-nord5 font-mono">{data.user.id.slice(0, 8)}...</div>
			</div>
			<div>
				<div class="text-xs text-nord4 uppercase">Created</div>
				<div class="text-sm text-nord5">{formatDate(data.user.createdAt)}</div>
			</div>
			<div>
				<div class="text-xs text-nord4 uppercase">Last Updated</div>
				<div class="text-sm text-nord5">{formatRelativeTime(data.user.updatedAt)}</div>
			</div>
		</div>
	</div>

	<!-- Usage Summary with Period Tabs -->
	<div class="card">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-sm font-semibold text-nord5 uppercase tracking-wide">Usage Summary</h2>
			<div class="tabs border-0">
				{#each periods as period}
					<button
						class="tab {selectedPeriod === period.value ? 'active' : ''}"
						onclick={() => selectedPeriod = period.value}
					>
						{period.label}
					</button>
				{/each}
			</div>
		</div>

		<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
			<div class="stat-card">
				<div class="stat-value text-nord8">{formatNumber(currentStats.requestCount)}</div>
				<div class="stat-label">Requests</div>
			</div>
			<div class="stat-card">
				<div class="stat-value text-nord14">{formatNumber(currentStats.totalTokens)}</div>
				<div class="stat-label">Total Tokens</div>
			</div>
			<div class="stat-card">
				<div class="stat-value text-nord9">{formatNumber(currentStats.promptTokens)}</div>
				<div class="stat-label">Prompt Tokens</div>
			</div>
			<div class="stat-card">
				<div class="stat-value text-nord15">{formatNumber(currentStats.completionTokens)}</div>
				<div class="stat-label">Completion</div>
			</div>
			<div class="stat-card">
				<div class="stat-value text-nord13">{formatDuration(currentStats.avgDuration)}</div>
				<div class="stat-label">Avg Duration</div>
			</div>
		</div>
	</div>

	<!-- Model breakdown and API keys row -->
	<div class="grid lg:grid-cols-2 gap-6">
		<!-- Model Breakdown -->
		<div class="card">
			<h2 class="text-sm font-semibold text-nord5 uppercase tracking-wide mb-4">Models Used (All Time)</h2>
			{#if data.modelBreakdown.length > 0}
				<div class="space-y-3">
					{#each data.modelBreakdown as model}
						<div>
							<div class="flex justify-between text-sm mb-1">
								<span class="text-nord4 truncate mr-2" title={model.model}>
									{model.model.split('/').pop()}
								</span>
								<span class="text-nord5 whitespace-nowrap">
									{formatNumber(model.requestCount)} req / {formatNumber(model.totalTokens)} tokens
								</span>
							</div>
							<div class="h-2 bg-nord2 rounded-full overflow-hidden">
								<div
									class="h-full bg-gradient-to-r from-nord10 to-nord8 rounded-full"
									style="width: {(model.requestCount / maxModelRequests) * 100}%"
								></div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-nord4 text-sm">No requests yet.</p>
			{/if}
		</div>

		<!-- API Keys -->
		<div class="card">
			<h2 class="text-sm font-semibold text-nord5 uppercase tracking-wide mb-4">API Keys</h2>
			{#if data.apiKeys.length > 0}
				<div class="space-y-2">
					{#each data.apiKeys as key}
						<div class="flex items-center justify-between p-2 rounded-lg bg-nord2">
							<div>
								<div class="font-medium text-nord5 text-sm">{key.name}</div>
								<div class="text-xs text-nord4 font-mono">{key.keyPreview}...</div>
							</div>
							<div class="text-right">
								{#if key.revokedAt}
									<span class="badge badge-danger">Revoked</span>
								{:else}
									<span class="badge badge-success">Active</span>
								{/if}
								<div class="text-xs text-nord4 mt-1">{formatRelativeTime(key.createdAt)}</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-nord4 text-sm">No API keys.</p>
			{/if}
		</div>
	</div>

	<!-- Recent Requests -->
	<div class="card">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-sm font-semibold text-nord5 uppercase tracking-wide">Recent Requests</h2>
			<a 
				href="/requests?user={data.user.id}" 
				class="text-xs text-nord8 hover:text-nord7"
			>
				View all requests
			</a>
		</div>

		{#if data.recentRequests.length > 0}
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>Model</th>
							<th class="text-right">Tokens</th>
							<th class="text-right">Duration</th>
							<th class="text-right">Time</th>
							<th>Preview</th>
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
								<td class="text-right">
									<span class="text-nord14 font-medium">{formatNumber(request.totalTokens)}</span>
									<span class="text-nord4 text-xs ml-1">
										({formatNumber(request.promptTokens)}+{formatNumber(request.completionTokens)})
									</span>
								</td>
								<td class="text-right text-nord13">
									{formatDuration(request.duration)}
								</td>
								<td class="text-right text-nord4 text-xs whitespace-nowrap">
									{formatRelativeTime(request.timestamp)}
								</td>
								<td class="max-w-xs">
									<span class="text-nord4 text-xs">
										{truncate(request.requestPreview, 50)}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="text-nord4 text-sm text-center py-8">No requests yet.</p>
		{/if}
	</div>
</div>
