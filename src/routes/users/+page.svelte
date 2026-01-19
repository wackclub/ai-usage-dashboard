<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { formatNumber, formatRelativeTime, formatCost } from '$lib/utils';

	let { data } = $props();

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
		goto('/users', { invalidateAll: true });
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

	const filterButtons = [
		{ value: 'all', label: 'All', count: data.filterCounts.total },
		{ value: 'verified', label: 'Verified', count: data.filterCounts.verified },
		{ value: 'skip_idv', label: 'Skip IDV', count: data.filterCounts.skipIdv },
		{ value: 'unverified', label: 'Unverified', count: data.filterCounts.unverified },
		{ value: 'banned', label: 'Banned', count: data.filterCounts.banned }
	];

	const sortOptions = [
		{ value: 'requests', label: 'Requests' },
		{ value: 'tokens', label: 'Tokens' },
		{ value: 'cost', label: 'Cost' },
		{ value: 'name', label: 'Name' },
		{ value: 'created', label: 'Created' }
	];

	async function toggleUserStatus(userId: string, field: 'is_banned' | 'skip_idv', currentValue: boolean) {
		try {
			const response = await fetch(`/users/${userId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: field, value: !currentValue })
			});
			if (response.ok) {
				// Refresh the page
				goto($page.url.toString(), { invalidateAll: true });
			}
		} catch (error) {
			console.error('Failed to update user:', error);
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold text-nord6">Users</h1>
		<p class="text-nord4 text-sm mt-1">
			{formatNumber(data.pagination.totalCount)} users
		</p>
	</div>

	<!-- Filters -->
	<div class="card space-y-4">
		<!-- Search -->
		<div>
			<input
				type="text"
				placeholder="Search by name, email, or Slack ID..."
				value={data.filters.search}
				oninput={handleSearchInput}
				class="w-full px-4 py-2 rounded-lg text-sm"
			/>
		</div>

		<!-- Filter buttons and sort -->
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div class="flex gap-1">
				{#each filterButtons as filter}
					<button
						class="px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-1.5 {data.filters.filter === filter.value
							? 'bg-nord10 text-nord6'
							: 'bg-nord2 text-nord4 hover:bg-nord3'}"
						onclick={() => updateFilter('filter', filter.value)}
					>
						{filter.label}
						<span class="text-[10px] opacity-70">({filter.count})</span>
					</button>
				{/each}
			</div>

			<div class="flex items-center gap-2">
				<label class="text-xs text-nord4">Sort:</label>
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
					onclick={() => updateFilter('order', data.filters.sortOrder === 'desc' ? 'asc' : 'desc')}
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
				<button class="btn btn-secondary text-xs" onclick={clearFilters}>Clear</button>
			</div>
		</div>
	</div>

	<!-- Users grid -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each data.users as user}
			<div class="card card-hover relative">
				<!-- Quick action buttons -->
				<div class="absolute top-3 right-3 flex gap-1">
					<button
						class="p-1.5 rounded-md transition-colors {user.skipIdv 
							? 'bg-nord15/20 text-nord15 hover:bg-nord15/30' 
							: 'bg-nord2 text-nord4 hover:bg-nord3'}"
						onclick={() => toggleUserStatus(user.id, 'skip_idv', user.skipIdv)}
						title={user.skipIdv ? 'Disable Skip IDV' : 'Enable Skip IDV'}
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
						</svg>
					</button>
					<button
						class="p-1.5 rounded-md transition-colors {user.isBanned 
							? 'bg-nord11/20 text-nord11 hover:bg-nord11/30' 
							: 'bg-nord2 text-nord4 hover:bg-nord3'}"
						onclick={() => toggleUserStatus(user.id, 'is_banned', user.isBanned)}
						title={user.isBanned ? 'Unban User' : 'Ban User'}
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
						</svg>
					</button>
				</div>

				<a href="/users/{user.id}" class="block hover:no-underline">
					<div class="flex items-start gap-3">
						{#if user.avatar}
							<img src={user.avatar} alt="" class="w-12 h-12 rounded-full flex-shrink-0" />
						{:else}
							<div class="w-12 h-12 rounded-full bg-nord3 flex items-center justify-center text-nord5 text-lg font-medium flex-shrink-0">
								{(user.name || user.email || '?').charAt(0).toUpperCase()}
							</div>
						{/if}
						<div class="flex-1 min-w-0">
							<div class="font-medium text-nord5 truncate">
								{user.name || 'Unknown'}
							</div>
							<div class="text-xs text-nord4 truncate">
								{user.email || user.slackId}
							</div>
							<!-- Badges -->
							<div class="flex flex-wrap gap-1 mt-2">
								{#if user.isBanned}
									<span class="badge badge-danger">Banned</span>
								{/if}
								{#if user.isIdvVerified}
									<span class="badge badge-success">Verified</span>
								{/if}
								{#if user.skipIdv}
									<span class="badge badge-purple">Skip IDV</span>
								{/if}
							</div>
						</div>
					</div>

					<!-- Stats -->
					<div class="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-nord2">
						<div class="text-center">
							<div class="text-lg font-bold text-nord8">{formatNumber(user.requestCount)}</div>
							<div class="text-[10px] text-nord4 uppercase">Requests</div>
						</div>
						<div class="text-center">
							<div class="text-lg font-bold text-nord14">{formatNumber(user.totalTokens)}</div>
							<div class="text-[10px] text-nord4 uppercase">Tokens</div>
						</div>
						<div class="text-center">
							<div class="text-lg font-bold text-nord15">{formatCost(user.totalCost)}</div>
							<div class="text-[10px] text-nord4 uppercase">Cost</div>
						</div>
						<div class="text-center">
							<div class="text-xs text-nord5">{formatRelativeTime(user.lastRequest)}</div>
							<div class="text-[10px] text-nord4 uppercase">Last Active</div>
						</div>
					</div>
				</a>
			</div>
		{:else}
			<div class="col-span-full text-center py-12 text-nord4">
				No users found matching your filters.
			</div>
		{/each}
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
