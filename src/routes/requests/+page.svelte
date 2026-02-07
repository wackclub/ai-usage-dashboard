<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { formatNumber, formatDuration, formatRelativeTime, truncate, formatCost } from '$lib/utils';

	let { data } = $props();

	let showModal = $state(false);
	let selectedRequest = $state<typeof data.requests[0] | null>(null);
	let fullRequestData = $state<{
		request: string;
		response: string;
		apiKey?: {
			id: string;
			key: string;
			name: string;
			revokedAt: string | null;
		} | null;
	} | null>(null);
	let loadingDetails = $state(false);

	const timeFilters = [
		{ value: 'hour', label: '1h' },
		{ value: 'day', label: '24h' },
		{ value: '7days', label: '7d' },
		{ value: '2weeks', label: '2w' },
		{ value: '30days', label: '30d' },
		{ value: 'all', label: 'All' }
	];

	const sortOptions = [
		{ value: 'timestamp', label: 'Time' },
		{ value: 'total_tokens', label: 'Tokens' },
		{ value: 'prompt_tokens', label: 'Prompt' },
		{ value: 'completion_tokens', label: 'Completion' },
		{ value: 'duration', label: 'Duration' },
		{ value: 'cost', label: 'Cost' },
		{ value: 'model', label: 'Model' }
	];

	function updateFilter(key: string, value: string) {
		const currentUrl = $page.url;
		const url = new URL(currentUrl.href);
		if (value) {
			url.searchParams.set(key, value);
		} else {
			url.searchParams.delete(key);
		}
		if (key !== 'page') {
			url.searchParams.set('page', '1');
		}
		goto(url.pathname + url.search, { invalidateAll: true });
	}

	function clearFilters() {
		goto('/requests', { invalidateAll: true });
	}

	async function openRequestModal(request: typeof data.requests[0]) {
		selectedRequest = request;
		showModal = true;
		fullRequestData = null;
		loadingDetails = true;
		
		try {
			const response = await fetch(`/api/requests/${request.id}`);
			if (response.ok) {
				const data = await response.json();
				fullRequestData = {
					request: data.request,
					response: data.response,
					apiKey: data.apiKey
				};
			}
		} catch (error) {
			console.error('Failed to load request details:', error);
		} finally {
			loadingDetails = false;
		}
	}

	async function revokeApiKey(keyId: string) {
		if (!confirm('Revoke this API key? This cannot be undone.')) return;
		
		try {
			const response = await fetch(`/api/keys/${keyId}/revoke`, { method: 'POST' });
			if (response.ok) {
				if (fullRequestData?.apiKey) {
					fullRequestData.apiKey.revokedAt = new Date().toISOString();
				}
			} else {
				alert('Failed to revoke API key');
			}
		} catch (error) {
			console.error('Failed to revoke key:', error);
			alert('Failed to revoke API key');
		}
	}

	function closeModal() {
		showModal = false;
		selectedRequest = null;
		fullRequestData = null;
	}

	function toggleSortOrder() {
		const newOrder = data.filters.sortOrder === 'desc' ? 'asc' : 'desc';
		updateFilter('order', newOrder);
	}

	let searchTimeout: ReturnType<typeof setTimeout>;
	function handleSearchInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			updateFilter('search', value);
		}, 300);
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape' && showModal) closeModal();
	}}
/>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-end justify-between animate-in">
		<div>
			<h1 class="text-2xl font-semibold text-primary tracking-tight">Request Log</h1>
			<p class="text-xs text-tertiary uppercase tracking-widest mt-1">
				{formatNumber(data.pagination.totalCount)} API calls recorded
			</p>
		</div>
	</div>

	<!-- Filters -->
	<div class="card space-y-4 animate-in delay-1">
		<!-- Search -->
		<div class="relative">
			<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
			<input
				type="text"
				placeholder="Search model, request, or response content..."
				value={data.filters.search}
				oninput={handleSearchInput}
				class="w-full pl-10 pr-4 py-2.5 text-xs"
			/>
		</div>

		<!-- Time filter row -->
		<div class="flex items-center gap-2">
			<span class="text-[10px] text-tertiary uppercase tracking-wider">Time</span>
			<div class="flex">
				{#each timeFilters as filter, i}
					<button
						class="px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium transition-all border-y border-r first:border-l {data.filters.timeFilter === filter.value
							? 'bg-accent text-primary border-accent'
							: 'bg-transparent text-tertiary border-default hover:text-secondary'}"
						style="border-radius: {i === 0 ? 'var(--radius) 0 0 var(--radius)' : i === timeFilters.length - 1 ? '0 var(--radius) var(--radius) 0' : '0'};"
						onclick={() => updateFilter('time', filter.value)}
					>
						{filter.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Advanced filters -->
		<div class="flex flex-wrap items-end gap-4">
			<div class="flex flex-col gap-1">
				<label class="text-[10px] text-tertiary uppercase tracking-wider">Model</label>
				<select
					class="px-3 py-1.5 text-xs min-w-[180px]"
					value={data.filters.model}
					onchange={(e) => updateFilter('model', e.currentTarget.value)}
				>
					<option value="">All models</option>
					{#each data.models as model}
						<option value={model}>{model.split('/').pop()}</option>
					{/each}
				</select>
			</div>

			<div class="flex flex-col gap-1">
				<label class="text-[10px] text-tertiary uppercase tracking-wider">User</label>
				<select
					class="px-3 py-1.5 text-xs min-w-[180px]"
					value={data.filters.userId}
					onchange={(e) => updateFilter('user', e.currentTarget.value)}
				>
					<option value="">All users</option>
					{#each data.users as user}
						<option value={user.id}>{user.name || user.email || user.id.slice(0, 8)}</option>
					{/each}
				</select>
			</div>

			<div class="flex flex-col gap-1">
				<label class="text-[10px] text-tertiary uppercase tracking-wider">Min Tokens</label>
				<input
					type="number"
					placeholder="0"
					value={data.filters.minTokens || ''}
					onchange={(e) => updateFilter('minTokens', e.currentTarget.value)}
					class="px-3 py-1.5 text-xs w-24"
				/>
			</div>

			<div class="flex flex-col gap-1">
				<label class="text-[10px] text-tertiary uppercase tracking-wider">Max Tokens</label>
				<input
					type="number"
					placeholder="∞"
					value={data.filters.maxTokens || ''}
					onchange={(e) => updateFilter('maxTokens', e.currentTarget.value)}
					class="px-3 py-1.5 text-xs w-24"
				/>
			</div>

			<div class="flex flex-col gap-1">
				<label class="text-[10px] text-tertiary uppercase tracking-wider">Sort</label>
				<div class="flex">
					<select
						class="px-3 py-1.5 text-xs"
						style="border-radius: var(--radius) 0 0 var(--radius);"
						value={data.filters.sortBy}
						onchange={(e) => updateFilter('sort', e.currentTarget.value)}
					>
						{#each sortOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
					<button
						class="w-8 flex items-center justify-center border border-l-0 border-default hover:border-accent/50 transition-colors"
						style="border-radius: 0 var(--radius) var(--radius) 0;"
						onclick={toggleSortOrder}
					>
						{#if data.filters.sortOrder === 'desc'}
							<svg class="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 9l-7 7-7-7" />
							</svg>
						{:else}
							<svg class="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 15l7-7 7 7" />
							</svg>
						{/if}
					</button>
				</div>
			</div>

			<button class="btn btn-secondary text-[10px]" onclick={clearFilters}>Reset</button>

			<label class="flex items-center gap-2 cursor-pointer ml-auto">
				<input
					type="checkbox"
					checked={data.filters.includeBanned}
					onchange={(e) => updateFilter('includeBanned', e.currentTarget.checked ? 'true' : '')}
					class="w-4 h-4"
				/>
				<span class="text-[10px] text-tertiary uppercase tracking-wider">Include banned</span>
			</label>
		</div>
	</div>

	<!-- Results table -->
	<div class="card p-0 overflow-hidden animate-in delay-2">
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>Model</th>
						<th>User</th>
						<th class="text-right">Tokens</th>
						<th class="text-right">Cost</th>
						<th class="text-right">Latency</th>
						<th class="text-right">Time</th>
						<th>Preview</th>
					</tr>
				</thead>
				<tbody>
					{#each data.requests as request}
						<tr
							class="cursor-pointer group"
							onclick={() => openRequestModal(request)}
						>
							<td>
								<code class="text-accent text-[11px] bg-accent/5 px-1.5 py-0.5 border border-accent/20" style="border-radius: var(--radius);">
									{request.model.split('/').pop()}
								</code>
							</td>
							<td>
								<a
									href="/users/{request.userId}"
									class="text-secondary hover:text-accent text-xs"
									onclick={(e) => e.stopPropagation()}
								>
									{request.userName || request.userEmail || 'Unknown'}
								</a>
							</td>
							<td class="text-right">
								<span class="text-success text-xs font-medium tabular-nums">{formatNumber(request.totalTokens)}</span>
								<span class="text-tertiary text-[10px] ml-1">
									({formatNumber(request.promptTokens)}+{formatNumber(request.completionTokens)})
								</span>
							</td>
							<td class="text-right">
								<span class="text-success text-[11px] tabular-nums font-mono">{formatCost(request.cost)}</span>
							</td>
							<td class="text-right">
								<span class="text-warning text-xs tabular-nums">{formatDuration(request.duration)}</span>
							</td>
							<td class="text-right text-tertiary text-[10px] whitespace-nowrap">
								{formatRelativeTime(request.timestamp)}
							</td>
							<td class="max-w-[200px]">
								<span class="text-tertiary text-[11px] truncate block">
									{truncate(request.requestPreview, 50)}
								</span>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="7" class="text-center py-12">
								<svg class="w-12 h-12 mx-auto mb-4 text-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
								<p class="text-xs text-tertiary uppercase tracking-wider">No requests match your filters</p>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Pagination -->
	{#if data.pagination.totalPages > 1}
		<div class="flex items-center justify-between animate-in delay-3">
			<div class="text-[10px] text-tertiary uppercase tracking-wider">
				Page {data.pagination.page} of {data.pagination.totalPages}
			</div>
			<div class="pagination">
				<button
					class="page-btn"
					disabled={data.pagination.page <= 1}
					onclick={() => updateFilter('page', '1')}
				>
					«
				</button>
				<button
					class="page-btn"
					disabled={data.pagination.page <= 1}
					onclick={() => updateFilter('page', String(data.pagination.page - 1))}
				>
					‹
				</button>
				
				{#each Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
					const start = Math.max(1, Math.min(data.pagination.page - 2, data.pagination.totalPages - 4));
					return start + i;
				}).filter(p => p <= data.pagination.totalPages) as pageNum}
					<button
						class="page-btn {pageNum === data.pagination.page ? 'active' : ''}"
						onclick={() => updateFilter('page', String(pageNum))}
					>
						{pageNum}
					</button>
				{/each}

				<button
					class="page-btn"
					disabled={data.pagination.page >= data.pagination.totalPages}
					onclick={() => updateFilter('page', String(data.pagination.page + 1))}
				>
					›
				</button>
				<button
					class="page-btn"
					disabled={data.pagination.page >= data.pagination.totalPages}
					onclick={() => updateFilter('page', String(data.pagination.totalPages))}
				>
					»
				</button>
			</div>
		</div>
	{/if}
</div>

<!-- Request Detail Modal -->
{#if showModal && selectedRequest}
	<div class="modal-backdrop" onclick={closeModal}>
		<div class="modal w-full max-w-4xl p-6" onclick={(e) => e.stopPropagation()}>
			<div class="flex items-start justify-between mb-6">
				<div>
					<h2 class="text-lg font-semibold text-primary">Request Details</h2>
					<p class="text-xs text-tertiary mt-1">
						<code class="text-accent">{selectedRequest.model}</code>
						<span class="mx-2">·</span>
						{formatRelativeTime(selectedRequest.timestamp)}
					</p>
				</div>
				<button
					class="w-8 h-8 flex items-center justify-center border border-default hover:border-danger hover:text-danger transition-colors"
					style="border-radius: var(--radius);"
					onclick={closeModal}
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Stats row -->
			<div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
				<div class="bg-tertiary border border-default p-3 text-center" style="border-radius: var(--radius);">
					<div class="text-xl font-bold text-success tabular-nums">{formatNumber(selectedRequest.totalTokens)}</div>
					<div class="text-[9px] text-tertiary uppercase tracking-widest">Total Tokens</div>
				</div>
				<div class="bg-tertiary border border-default p-3 text-center" style="border-radius: var(--radius);">
					<div class="text-xl font-bold text-accent tabular-nums">{formatNumber(selectedRequest.promptTokens)}</div>
					<div class="text-[9px] text-tertiary uppercase tracking-widest">Prompt</div>
				</div>
				<div class="bg-tertiary border border-default p-3 text-center" style="border-radius: var(--radius);">
					<div class="text-xl font-bold text-info tabular-nums">{formatNumber(selectedRequest.completionTokens)}</div>
					<div class="text-[9px] text-tertiary uppercase tracking-widest">Completion</div>
				</div>
				<div class="bg-tertiary border border-default p-3 text-center" style="border-radius: var(--radius);">
					<div class="text-xl font-bold text-warning tabular-nums">{formatDuration(selectedRequest.duration)}</div>
					<div class="text-[9px] text-tertiary uppercase tracking-widest">Latency</div>
				</div>
				<div class="bg-tertiary border border-default p-3 text-center" style="border-radius: var(--radius);">
					<div class="text-xl font-bold text-success tabular-nums">{formatCost(selectedRequest.cost)}</div>
					<div class="text-[9px] text-tertiary uppercase tracking-widest">Cost</div>
				</div>
			</div>

			<!-- User info -->
			<div class="mb-6 p-4 bg-tertiary border border-default" style="border-radius: var(--radius);">
				<div class="flex items-start justify-between">
					<div>
						<div class="text-[9px] text-tertiary uppercase tracking-widest mb-1">User</div>
						<a href="/users/{selectedRequest.userId}" class="text-accent hover:text-primary text-sm">
							{selectedRequest.userName || selectedRequest.userEmail || 'Unknown'}
						</a>
						<span class="text-tertiary text-xs ml-2">
							<code class="text-[10px] bg-hover px-1 py-0.5" style="border-radius: var(--radius);">{selectedRequest.userId.slice(0, 8)}...</code>
						</span>
						<span class="text-tertiary text-[10px] ml-2">IP: {selectedRequest.ip}</span>
					</div>
					
					{#if fullRequestData?.apiKey}
						<div class="text-right">
							<div class="text-[9px] text-tertiary uppercase tracking-widest mb-1">API Key</div>
							<div class="flex items-center gap-2 justify-end">
								<code class="text-[10px] text-secondary bg-hover px-2 py-0.5" style="border-radius: var(--radius);">
									{fullRequestData.apiKey.key}
								</code>
								{#if fullRequestData.apiKey.revokedAt}
									<span class="badge badge-danger">Revoked</span>
								{:else}
									<button 
										class="text-[10px] text-danger hover:text-primary uppercase tracking-wider"
										onclick={() => revokeApiKey(fullRequestData!.apiKey!.id)}
									>
										Revoke
									</button>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Request content -->
			<div class="space-y-4">
				<div>
					<div class="text-[9px] text-tertiary uppercase tracking-widest mb-2">Request</div>
					{#if loadingDetails}
						<div class="bg-primary border border-default p-6 flex items-center justify-center" style="border-radius: var(--radius);">
							<div class="spinner mr-3"></div>
							<span class="text-tertiary text-xs uppercase tracking-wider">Loading...</span>
						</div>
					{:else if fullRequestData}
						<pre class="bg-primary border border-default p-4 text-xs text-secondary overflow-auto max-h-48 whitespace-pre-wrap font-mono" style="border-radius: var(--radius);">{fullRequestData.request}</pre>
					{:else}
						<pre class="bg-primary border border-default p-4 text-xs text-secondary overflow-auto max-h-48 whitespace-pre-wrap font-mono" style="border-radius: var(--radius);">{selectedRequest.requestPreview}...</pre>
					{/if}
				</div>
				<div>
					<div class="text-[9px] text-tertiary uppercase tracking-widest mb-2">Response</div>
					{#if loadingDetails}
						<div class="bg-primary border border-default p-6 flex items-center justify-center" style="border-radius: var(--radius);">
							<div class="spinner mr-3"></div>
							<span class="text-tertiary text-xs uppercase tracking-wider">Loading...</span>
						</div>
					{:else if fullRequestData}
						<pre class="bg-primary border border-default p-4 text-xs text-secondary overflow-auto max-h-64 whitespace-pre-wrap font-mono" style="border-radius: var(--radius);">{fullRequestData.response}</pre>
					{:else}
						<div class="bg-primary border border-default p-6 text-xs text-tertiary italic text-center" style="border-radius: var(--radius);">
							Loading response...
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
