<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { formatNumber, formatDuration, formatRelativeTime, truncate, formatCost } from '$lib/utils';

	let { data } = $props();

	let showModal = $state(false);
	let selectedRequest = $state<typeof data.requests[0] | null>(null);
	let fullRequestData = $state<{
		request: string;
		response: string;
	} | null>(null);
	let loadingDetails = $state(false);

	const timeFilters = [
		{ value: 'hour', label: 'Last Hour' },
		{ value: 'day', label: 'Last Day' },
		{ value: '7days', label: '7 Days' },
		{ value: '2weeks', label: '2 Weeks' },
		{ value: '30days', label: '30 Days' },
		{ value: 'all', label: 'All Time' }
	];

	const sortOptions = [
		{ value: 'timestamp', label: 'Time' },
		{ value: 'total_tokens', label: 'Total Tokens' },
		{ value: 'prompt_tokens', label: 'Prompt Tokens' },
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
		// Reset to page 1 when filters change (except for page changes)
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
					response: data.response
				};
			}
		} catch (error) {
			console.error('Failed to load request details:', error);
		} finally {
			loadingDetails = false;
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

	// Debounced search
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
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-nord6">Requests</h1>
			<p class="text-nord4 text-sm mt-1">
				{formatNumber(data.pagination.totalCount)} requests found
			</p>
		</div>
	</div>

	<!-- Filters -->
	<div class="card space-y-4">
		<!-- Search -->
		<div>
			<input
				type="text"
				placeholder="Search model, request, or response..."
				value={data.filters.search}
				oninput={handleSearchInput}
				class="w-full px-4 py-2 rounded-lg text-sm"
			/>
		</div>

		<!-- Filter row -->
		<div class="flex flex-wrap gap-3">
			<!-- Time filter -->
			<div class="flex gap-1">
				{#each timeFilters as filter}
					<button
						class="px-3 py-1.5 text-xs rounded-md transition-colors {data.filters.timeFilter === filter.value
							? 'bg-nord10 text-nord6'
							: 'bg-nord2 text-nord4 hover:bg-nord3'}"
						onclick={() => updateFilter('time', filter.value)}
					>
						{filter.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Advanced filters row -->
		<div class="flex flex-wrap items-end gap-4">
			<!-- Model filter -->
			<div class="flex flex-col gap-1">
				<label class="text-xs text-nord4">Model</label>
				<select
					class="px-3 py-1.5 rounded-md text-sm min-w-[180px]"
					value={data.filters.model}
					onchange={(e) => updateFilter('model', e.currentTarget.value)}
				>
					<option value="">All models</option>
					{#each data.models as model}
						<option value={model}>{model.split('/').pop()}</option>
					{/each}
				</select>
			</div>

			<!-- User filter -->
			<div class="flex flex-col gap-1">
				<label class="text-xs text-nord4">User</label>
				<select
					class="px-3 py-1.5 rounded-md text-sm min-w-[180px]"
					value={data.filters.userId}
					onchange={(e) => updateFilter('user', e.currentTarget.value)}
				>
					<option value="">All users</option>
					{#each data.users as user}
						<option value={user.id}>{user.name || user.email || user.id.slice(0, 8)}</option>
					{/each}
				</select>
			</div>

			<!-- Token range -->
			<div class="flex flex-col gap-1">
				<label class="text-xs text-nord4">Min Tokens</label>
				<input
					type="number"
					placeholder="0"
					value={data.filters.minTokens || ''}
					onchange={(e) => updateFilter('minTokens', e.currentTarget.value)}
					class="px-3 py-1.5 rounded-md text-sm w-24"
				/>
			</div>

			<div class="flex flex-col gap-1">
				<label class="text-xs text-nord4">Max Tokens</label>
				<input
					type="number"
					placeholder="any"
					value={data.filters.maxTokens || ''}
					onchange={(e) => updateFilter('maxTokens', e.currentTarget.value)}
					class="px-3 py-1.5 rounded-md text-sm w-24"
				/>
			</div>

			<!-- Sort -->
			<div class="flex flex-col gap-1">
				<label class="text-xs text-nord4">Sort by</label>
				<div class="flex gap-1">
					<select
						class="px-3 py-1.5 rounded-md text-sm"
						value={data.filters.sortBy}
						onchange={(e) => updateFilter('sort', e.currentTarget.value)}
					>
						{#each sortOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
					<button
						class="px-2 py-1.5 rounded-md bg-nord2 hover:bg-nord3 transition-colors"
						onclick={toggleSortOrder}
						title={data.filters.sortOrder === 'desc' ? 'Descending' : 'Ascending'}
					>
						{#if data.filters.sortOrder === 'desc'}
							<svg class="w-4 h-4 text-nord4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
							</svg>
						{:else}
							<svg class="w-4 h-4 text-nord4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
							</svg>
						{/if}
					</button>
				</div>
			</div>

			<!-- Clear filters -->
			<button class="btn btn-secondary text-xs" onclick={clearFilters}>
				Clear
			</button>

			<!-- Include banned users toggle -->
			<label class="flex items-center gap-2 cursor-pointer ml-auto">
				<input
					type="checkbox"
					checked={data.filters.includeBanned}
					onchange={(e) => updateFilter('includeBanned', e.currentTarget.checked ? 'true' : '')}
					class="w-4 h-4 rounded border-nord3 bg-nord1 text-nord10 focus:ring-nord10 focus:ring-offset-nord0"
				/>
				<span class="text-xs text-nord4">Include banned users</span>
			</label>
		</div>
	</div>

	<!-- Results table -->
	<div class="card p-0 overflow-hidden">
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>Model</th>
						<th>User</th>
						<th class="text-right">Tokens</th>
						<th class="text-right">Cost</th>
						<th class="text-right">Duration</th>
						<th class="text-right">Time</th>
						<th>Preview</th>
					</tr>
				</thead>
				<tbody>
					{#each data.requests as request}
						<tr
							class="cursor-pointer"
							onclick={() => openRequestModal(request)}
						>
							<td>
								<span class="text-nord8 font-mono text-xs">
									{request.model.split('/').pop()}
								</span>
							</td>
							<td>
								<a
									href="/users/{request.userId}"
									class="text-nord4 hover:text-nord8"
									onclick={(e) => e.stopPropagation()}
								>
									{request.userName || request.userEmail || 'Unknown'}
								</a>
							</td>
							<td class="text-right">
								<span class="text-nord14 font-medium">{formatNumber(request.totalTokens)}</span>
								<span class="text-nord4 text-xs ml-1">
									({formatNumber(request.promptTokens)}+{formatNumber(request.completionTokens)})
								</span>
							</td>
							<td class="text-right text-nord14 font-mono text-xs">
								{formatCost(request.cost)}
							</td>
							<td class="text-right text-nord13">
								{formatDuration(request.duration)}
							</td>
							<td class="text-right text-nord4 text-xs whitespace-nowrap">
								{formatRelativeTime(request.timestamp)}
							</td>
							<td class="max-w-xs">
								<span class="text-nord4 text-xs">
									{truncate(request.requestPreview, 60)}
								</span>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="7" class="text-center py-8 text-nord4">
								No requests found matching your filters.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Pagination -->
	{#if data.pagination.totalPages > 1}
		<div class="flex items-center justify-between">
			<div class="text-sm text-nord4">
				Page {data.pagination.page} of {data.pagination.totalPages}
			</div>
			<div class="pagination">
				<button
					class="page-btn"
					disabled={data.pagination.page <= 1}
					onclick={() => updateFilter('page', '1')}
				>
					First
				</button>
				<button
					class="page-btn"
					disabled={data.pagination.page <= 1}
					onclick={() => updateFilter('page', String(data.pagination.page - 1))}
				>
					Prev
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
					Next
				</button>
				<button
					class="page-btn"
					disabled={data.pagination.page >= data.pagination.totalPages}
					onclick={() => updateFilter('page', String(data.pagination.totalPages))}
				>
					Last
				</button>
			</div>
		</div>
	{/if}
</div>

<!-- Request Detail Modal -->
{#if showModal && selectedRequest}
	<div class="modal-backdrop" onclick={closeModal}>
		<div class="modal w-full max-w-4xl p-6" onclick={(e) => e.stopPropagation()}>
			<div class="flex items-start justify-between mb-4">
				<div>
					<h2 class="text-lg font-semibold text-nord6">Request Details</h2>
					<p class="text-sm text-nord4 mt-1">
						{selectedRequest.model} - {formatRelativeTime(selectedRequest.timestamp)}
					</p>
				</div>
				<button class="text-nord4 hover:text-nord6" onclick={closeModal}>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Stats row -->
			<div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
				<div class="bg-nord2 rounded-lg p-3 text-center">
					<div class="text-xl font-bold text-nord14">{formatNumber(selectedRequest.totalTokens)}</div>
					<div class="text-xs text-nord4">Total Tokens</div>
				</div>
				<div class="bg-nord2 rounded-lg p-3 text-center">
					<div class="text-xl font-bold text-nord8">{formatNumber(selectedRequest.promptTokens)}</div>
					<div class="text-xs text-nord4">Prompt</div>
				</div>
				<div class="bg-nord2 rounded-lg p-3 text-center">
					<div class="text-xl font-bold text-nord15">{formatNumber(selectedRequest.completionTokens)}</div>
					<div class="text-xs text-nord4">Completion</div>
				</div>
				<div class="bg-nord2 rounded-lg p-3 text-center">
					<div class="text-xl font-bold text-nord13">{formatDuration(selectedRequest.duration)}</div>
					<div class="text-xs text-nord4">Duration</div>
				</div>
				<div class="bg-nord2 rounded-lg p-3 text-center">
					<div class="text-xl font-bold text-nord14">{formatCost(selectedRequest.cost)}</div>
					<div class="text-xs text-nord4">Cost</div>
				</div>
			</div>

			<!-- User info -->
			<div class="mb-4 p-3 bg-nord2 rounded-lg">
				<div class="text-xs text-nord4 mb-1">User</div>
				<a href="/users/{selectedRequest.userId}" class="text-nord8 hover:text-nord7">
					{selectedRequest.userName || selectedRequest.userEmail || 'Unknown'} ({selectedRequest.userId.slice(0, 8)}...)
				</a>
				<span class="text-nord4 text-xs ml-2">IP: {selectedRequest.ip}</span>
			</div>

			<!-- Request content -->
			<div class="space-y-4">
				<div>
					<div class="text-xs text-nord4 uppercase tracking-wide mb-2">Request</div>
					{#if loadingDetails}
						<div class="bg-nord0 border border-nord2 rounded-lg p-4 flex items-center justify-center">
							<div class="spinner"></div>
							<span class="ml-2 text-nord4 text-sm">Loading...</span>
						</div>
					{:else if fullRequestData}
						<pre class="bg-nord0 border border-nord2 rounded-lg p-4 text-sm text-nord5 overflow-auto max-h-48 whitespace-pre-wrap">{fullRequestData.request}</pre>
					{:else}
						<pre class="bg-nord0 border border-nord2 rounded-lg p-4 text-sm text-nord5 overflow-auto max-h-48 whitespace-pre-wrap">{selectedRequest.requestPreview}...</pre>
					{/if}
				</div>
				<div>
					<div class="text-xs text-nord4 uppercase tracking-wide mb-2">Response</div>
					{#if loadingDetails}
						<div class="bg-nord0 border border-nord2 rounded-lg p-4 flex items-center justify-center">
							<div class="spinner"></div>
							<span class="ml-2 text-nord4 text-sm">Loading...</span>
						</div>
					{:else if fullRequestData}
						<pre class="bg-nord0 border border-nord2 rounded-lg p-4 text-sm text-nord5 overflow-auto max-h-64 whitespace-pre-wrap">{fullRequestData.response}</pre>
					{:else}
						<div class="bg-nord0 border border-nord2 rounded-lg p-4 text-sm text-nord4 italic">
							Loading response...
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
