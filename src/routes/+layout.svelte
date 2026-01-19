<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	const navItems = [
		{ href: '/', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
		{ href: '/requests', label: 'Requests', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
		{ href: '/users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>AI Usage Dashboard</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="min-h-screen bg-nord0">
	<!-- Navigation -->
	<nav class="bg-nord1 border-b border-nord2 sticky top-0 z-40">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between h-14">
				<div class="flex items-center gap-8">
					<!-- Logo -->
					<a href="/" class="flex items-center gap-2 text-nord6 hover:text-nord6 hover:no-underline">
						<svg class="w-6 h-6 text-nord8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
						<span class="font-semibold">AI Dashboard</span>
					</a>

					<!-- Nav Links -->
					<div class="hidden md:flex items-center gap-1">
						{#each navItems as item}
							<a
								href={item.href}
								class="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-nord4 hover:text-nord6 hover:bg-nord2 hover:no-underline transition-colors"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
								</svg>
								{item.label}
							</a>
						{/each}
					</div>
				</div>

				<!-- Right side -->
				<div class="flex items-center gap-3">
					<span class="text-xs text-nord3">Internal Tool</span>
				</div>
			</div>
		</div>
	</nav>

	<!-- Mobile nav -->
	<div class="md:hidden bg-nord1 border-b border-nord2 px-4 py-2">
		<div class="flex items-center gap-2">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-nord4 hover:text-nord6 hover:bg-nord2 hover:no-underline transition-colors"
				>
					<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
					</svg>
					{item.label}
				</a>
			{/each}
		</div>
	</div>

	<!-- Main content -->
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		{@render children()}
	</main>
</div>
