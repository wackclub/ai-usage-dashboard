<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { browser } from '$app/environment';

	let { children } = $props();

	const themes = [
		{ id: 'noir', label: 'Noir', icon: '◼' },
		{ id: 'aurora', label: 'Aurora', icon: '◐' },
		{ id: 'brutalist', label: 'Brutalist', icon: '▣' },
		{ id: 'candy', label: 'Candy', icon: '●' }
	];

	let currentTheme = $state('noir');
	let showThemePicker = $state(false);

	$effect(() => {
		if (browser) {
			const saved = localStorage.getItem('theme');
			if (saved && themes.some(t => t.id === saved)) {
				currentTheme = saved;
			}
			document.documentElement.setAttribute('data-theme', currentTheme);
		}
	});

	function setTheme(theme: string) {
		currentTheme = theme;
		if (browser) {
			localStorage.setItem('theme', theme);
			document.documentElement.setAttribute('data-theme', theme);
		}
		showThemePicker = false;
	}

	const navItems = [
		{ href: '/', label: 'Overview', icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z' },
		{ href: '/requests', label: 'Requests', icon: 'M4 6h16M4 12h16M4 18h7' },
		{ href: '/users', label: 'Users', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Hack Club AI Dashboard</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
</svelte:head>

<div class="min-h-screen bg-primary relative">
	<!-- Navigation -->
	<nav class="sticky top-0 z-50 border-b border-default backdrop-blur-md bg-primary/90">
		<div class="max-w-7xl mx-auto px-6 lg:px-8">
			<div class="flex items-center justify-between h-16">
				<div class="flex items-center gap-10">
					<!-- Logo -->
					<a href="/" class="flex items-center gap-3 hover:no-underline group">
						<div class="relative">
							<div class="w-9 h-9 border-2 border-danger bg-danger/10 flex items-center justify-center" style="border-radius: var(--radius);">
								<svg class="w-5 h-5 text-danger" viewBox="0 0 16 16" fill="currentColor">
									<path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0ZM4.756 5.582l2.265.543a.318.318 0 0 1 .125.564l-1.76 1.49a.318.318 0 0 0-.045.444l1.182 1.505a.318.318 0 0 1-.232.511l-2.309.16a.318.318 0 0 1-.292-.449l1.066-2.268ZM9.5 12.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm1.744-6.668l-2.265.543a.318.318 0 0 0-.125.564l1.76 1.49a.318.318 0 0 1 .045.444l-1.182 1.505a.318.318 0 0 0 .232.511l2.309.16a.318.318 0 0 0 .292-.449l-1.066-2.268Z"/>
								</svg>
							</div>
						</div>
						<div class="flex flex-col">
							<span class="text-sm font-semibold text-primary tracking-wide">HACK CLUB</span>
							<span class="text-[10px] text-tertiary tracking-[0.15em]">AI USAGE</span>
						</div>
					</a>

					<!-- Nav Links -->
					<div class="hidden md:flex items-center gap-1">
						{#each navItems as item}
							<a
								href={item.href}
								class="flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wider text-secondary hover:text-accent transition-all hover:no-underline"
								style="border-radius: var(--radius);"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={item.icon} />
								</svg>
								{item.label}
							</a>
						{/each}
					</div>
				</div>

				<!-- Right side: Theme picker + Status -->
				<div class="flex items-center gap-4">
					<!-- Theme picker -->
					<div class="relative">
						<button
							class="flex items-center gap-2 px-3 py-1.5 text-xs text-tertiary hover:text-secondary border border-default hover:border-accent transition-all"
							style="border-radius: var(--radius);"
							onclick={() => showThemePicker = !showThemePicker}
						>
							<span class="text-base">{themes.find(t => t.id === currentTheme)?.icon}</span>
							<span class="hidden sm:inline uppercase tracking-wider">{currentTheme}</span>
						</button>

						{#if showThemePicker}
							<div
								class="absolute right-0 top-full mt-2 bg-secondary border border-default shadow-lg z-50"
								style="border-radius: var(--radius);"
							>
								{#each themes as theme}
									<button
										class="flex items-center gap-3 w-full px-4 py-2.5 text-xs uppercase tracking-wider transition-all {theme.id === currentTheme ? 'text-accent bg-hover' : 'text-secondary hover:bg-hover'}"
										onclick={() => setTheme(theme.id)}
									>
										<span class="text-base">{theme.icon}</span>
										{theme.label}
									</button>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Status -->
					<div class="flex items-center gap-2">
						<div class="w-2 h-2 bg-success rounded-full pulse"></div>
						<span class="text-[10px] text-tertiary uppercase tracking-widest hidden sm:inline">Online</span>
					</div>
				</div>
			</div>
		</div>
	</nav>

	<!-- Mobile nav -->
	<div class="md:hidden border-b border-default bg-tertiary/50 backdrop-blur-sm px-4 py-2">
		<div class="flex items-center gap-1">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-secondary hover:text-accent transition-all hover:no-underline"
				>
					<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={item.icon} />
					</svg>
					{item.label}
				</a>
			{/each}
		</div>
	</div>

	<!-- Main content -->
	<main class="max-w-7xl mx-auto px-6 lg:px-8 py-8 relative">
		{@render children()}
	</main>

	<!-- Footer -->
	<div class="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent pointer-events-none"></div>
</div>

<!-- Click outside to close theme picker -->
{#if showThemePicker}
	<div class="fixed inset-0 z-40" onclick={() => showThemePicker = false}></div>
{/if}
