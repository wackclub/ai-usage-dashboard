<script lang="ts">
	import { goto } from '$app/navigation';
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

	let searchTimeout: ReturnType<typeof setTimeout>;
	function handleSearchInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			updateFilter('search', value);
		}, 300);
	}

	let filterButtons = $derived([
		{ value: 'all', label: 'All', count: data.filterCounts.total },
		{ value: 'verified', label: 'Verified', count: data.filterCounts.verified },
		{ value: 'skip_idv', label: 'Bypass', count: data.filterCounts.skipIdv },
		{ value: 'unverified', label: 'Unverified', count: data.filterCounts.unverified },
		{ value: 'banned', label: 'Banned', count: data.filterCounts.banned }
	]);

	const sortOptions = [
		{ value: 'requests', label: 'Requests' },
		{ value: 'tokens', label: 'Tokens' },
		{ value: 'cost', label: 'Cost' },
		{ value: 'name', label: 'Name' },
		{ value: 'created', label: 'Created' }
	];

	const timePeriodOptions = [
		{ value: 'all', label: 'All Time' },
		{ value: '24h', label: 'Past 24h' },
		{ value: '1w', label: 'Past Week' },
		{ value: '1m', label: 'Past Month' }
	];

	async function toggleUserStatus(userId: string, field: 'is_banned' | 'skip_idv', currentValue: boolean) {
		try {
			const response = await fetch(`/users/${userId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: field, value: !currentValue })
			});
			if (response.ok) {
				goto($page.url.toString(), { invalidateAll: true });
			}
		} catch (error) {
			console.error('Failed to update user:', error);
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-end justify-between animate-in">
		<div>
			<h1 class="text-2xl font-semibold text-primary tracking-tight">User Registry</h1>
			<p class="text-xs text-tertiary uppercase tracking-widest mt-1">
				{formatNumber(data.pagination.totalCount)} registered accounts
			</p>
		</div>
	</div>

	<!-- Filters -->
	<div class="card animate-in delay-1">
		<!-- Search -->
		<div class="relative mb-4">
			<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
			<input
				type="text"
				placeholder="Search by name, email, or Slack ID..."
				value={data.filters.search}
				oninput={handleSearchInput}
				class="w-full pl-10 pr-4 py-2.5 text-xs"
			/>
		</div>

		<!-- Filter buttons and sort -->
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div class="flex flex-wrap gap-1">
				{#each filterButtons as filter}
					<button
						class="px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium transition-all border {data.filters.filter === filter.value
							? 'bg-accent text-primary border-accent'
							: 'bg-transparent text-tertiary border-default hover:border-accent/50 hover:text-secondary'}"
						style="border-radius: var(--radius);"
						onclick={() => updateFilter('filter', filter.value)}
					>
						{filter.label}
						<span class="opacity-60 ml-1">({filter.count})</span>
					</button>
				{/each}
			</div>

			<div class="flex items-center gap-3">
				<div class="flex items-center gap-2">
					<label class="text-[10px] text-tertiary uppercase tracking-wider">Period</label>
					<select
						class="px-3 py-1.5 text-xs min-w-[100px]"
						value={data.filters.timePeriod}
						onchange={(e) => updateFilter('period', e.currentTarget.value)}
					>
						{#each timePeriodOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>
				<div class="flex items-center gap-2">
					<label class="text-[10px] text-tertiary uppercase tracking-wider">Sort</label>
					<select
						class="px-3 py-1.5 text-xs min-w-[100px]"
						value={data.filters.sortBy}
						onchange={(e) => updateFilter('sort', e.currentTarget.value)}
					>
						{#each sortOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>
				<button
					class="w-8 h-8 flex items-center justify-center border border-default hover:border-accent/50 transition-colors"
					style="border-radius: var(--radius);"
					onclick={() => updateFilter('order', data.filters.sortOrder === 'desc' ? 'asc' : 'desc')}
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
				<button class="btn btn-secondary text-[10px]" onclick={clearFilters}>Reset</button>
			</div>
		</div>
	</div>

	<!-- Users grid -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-in delay-2">
		{#each data.users as user, i}
			<div class="card card-hover relative group" style="animation-delay: {i * 30}ms">
				<!-- Quick action buttons -->
				<div class="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
					<button
						class="w-7 h-7 flex items-center justify-center border transition-all {user.skipIdv 
							? 'bg-info/10 border-info text-info hover:bg-info/20' 
							: 'bg-transparent border-default text-tertiary hover:border-info hover:text-info'}"
						style="border-radius: var(--radius);"
						onclick={(e) => { e.stopPropagation(); toggleUserStatus(user.id, 'skip_idv', user.skipIdv); }}
						title={user.skipIdv ? 'Remove IDV Bypass' : 'Enable IDV Bypass'}
					>
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
						</svg>
					</button>
					<button
						class="w-7 h-7 flex items-center justify-center border transition-all {user.isBanned 
							? 'bg-danger/10 border-danger text-danger hover:bg-danger/20' 
							: 'bg-transparent border-default text-tertiary hover:border-danger hover:text-danger'}"
						style="border-radius: var(--radius);"
						onclick={(e) => { e.stopPropagation(); toggleUserStatus(user.id, 'is_banned', user.isBanned); }}
						title={user.isBanned ? 'Unban User' : 'Ban User'}
					>
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
						</svg>
					</button>
				</div>

				<a href="/users/{user.id}" class="block hover:no-underline">
					<div class="flex items-start gap-3">
						{#if user.avatar}
							<img src={user.avatar} alt="" class="w-12 h-12 border border-default flex-shrink-0" style="border-radius: var(--radius);" />
						{:else}
							<div class="w-12 h-12 bg-hover border border-default flex items-center justify-center text-secondary text-lg font-medium flex-shrink-0" style="border-radius: var(--radius);">
								{(user.name || user.email || '?').charAt(0).toUpperCase()}
							</div>
						{/if}
						<div class="flex-1 min-w-0">
							<div class="font-medium text-secondary text-sm truncate group-hover:text-primary transition-colors">
								{user.name || 'Unknown'}
							</div>
							<div class="text-[10px] text-tertiary truncate">
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
									<span class="badge badge-purple">Bypass</span>
								{/if}
							</div>
						</div>
					</div>

					<!-- Stats -->
					<div class="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-default/50">
						<div class="text-center">
							<div class="text-sm font-bold text-accent tabular-nums">{formatNumber(user.requestCount)}</div>
							<div class="text-[8px] text-tertiary uppercase tracking-wider">Req</div>
						</div>
						<div class="text-center">
							<div class="text-sm font-bold text-success tabular-nums">{formatNumber(user.totalTokens)}</div>
							<div class="text-[8px] text-tertiary uppercase tracking-wider">Tokens</div>
						</div>
						<div class="text-center">
							<div class="text-sm font-bold text-info tabular-nums">{formatCost(user.totalCost)}</div>
							<div class="text-[8px] text-tertiary uppercase tracking-wider">Cost</div>
						</div>
						<div class="text-center">
							<div class="text-[10px] text-secondary">{formatRelativeTime(user.lastRequest)}</div>
							<div class="text-[8px] text-tertiary uppercase tracking-wider">Active</div>
						</div>
					</div>
				</a>
			</div>
		{:else}
			<div class="col-span-full text-center py-16 text-tertiary">
				<svg class="w-12 h-12 mx-auto mb-4 text-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
				<p class="text-xs uppercase tracking-wider">No users match your filters</p>
			</div>
		{/each}
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
