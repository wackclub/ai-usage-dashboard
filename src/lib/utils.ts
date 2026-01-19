export function formatNumber(num: number): string {
	if (num >= 1_000_000) {
		return (num / 1_000_000).toFixed(1) + 'M';
	}
	if (num >= 1_000) {
		return (num / 1_000).toFixed(1) + 'K';
	}
	return num.toLocaleString();
}

export function formatCost(amount: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 4,
		maximumFractionDigits: 6
	}).format(amount || 0);
}

export function formatTokens(tokens: number): string {
	return formatNumber(tokens);
}

export function formatDuration(ms: number): string {
	if (ms >= 60000) {
		return (ms / 60000).toFixed(1) + 'm';
	}
	if (ms >= 1000) {
		return (ms / 1000).toFixed(1) + 's';
	}
	return ms + 'ms';
}

export function formatDate(date: Date | string): string {
	const d = new Date(date);
	return d.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function formatRelativeTime(date: Date | string): string {
	const d = new Date(date);
	const now = new Date();
	const diff = now.getTime() - d.getTime();

	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days = Math.floor(diff / 86400000);

	if (minutes < 1) return 'just now';
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days < 7) return `${days}d ago`;
	return formatDate(date);
}

export function truncate(str: string, length: number): string {
	if (str.length <= length) return str;
	return str.slice(0, length) + '...';
}

export function getTimeFilterSQL(filter: string): string {
	switch (filter) {
		case 'hour':
			return "timestamp > NOW() - INTERVAL '1 hour'";
		case 'day':
			return "timestamp > NOW() - INTERVAL '1 day'";
		case '7days':
			return "timestamp > NOW() - INTERVAL '7 days'";
		case '2weeks':
			return "timestamp > NOW() - INTERVAL '14 days'";
		case '30days':
			return "timestamp > NOW() - INTERVAL '30 days'";
		default:
			return '1=1';
	}
}

export function getTimeFilterInterval(filter: string): string {
	switch (filter) {
		case 'hour':
			return '1 hour';
		case 'day':
			return '1 day';
		case '7days':
			return '7 days';
		case '2weeks':
			return '14 days';
		case '30days':
			return '30 days';
		default:
			return '10000 days';
	}
}
