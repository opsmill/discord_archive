import { base } from '$app/paths';
import type { ThreadData, ChannelData, AvailableTag } from './types';

export async function loadAllThreads(threadFiles: string[]): Promise<ThreadData[]> {

	// Load all files in parallel for fastest loading
	const promises = threadFiles.map(async (file) => {
		try {
			const response = await fetch(`${base}/data/${file}`);
			if (response.ok) {
				const data = await response.json();
				if (Array.isArray(data) && data.length > 0) {
					return data[0] as ThreadData;
				}
			}
		} catch (error) {
			console.error(`Failed to load ${file}:`, error);
		}
		return null;
	});

	const results = await Promise.all(promises);
	const threads = results.filter((t): t is ThreadData => t !== null);

	threads.sort((a, b) => {
		const dateA = new Date(a.thread.thread_metadata.create_timestamp);
		const dateB = new Date(b.thread.thread_metadata.create_timestamp);
		return dateB.getTime() - dateA.getTime();
	});

	return threads;
}

// Progressive loading - calls onProgress as each thread loads
export async function loadThreadsProgressively(
	threadFiles: string[],
	onProgress: (threads: ThreadData[]) => void
): Promise<ThreadData[]> {
	const threads: ThreadData[] = [];
	let pending = threadFiles.length;

	if (pending === 0) {
		return threads;
	}

	return new Promise((resolve) => {
		threadFiles.forEach(async (file) => {
			try {
				const response = await fetch(`${base}/data/${file}`);
				if (response.ok) {
					const data = await response.json();
					if (Array.isArray(data) && data.length > 0) {
						threads.push(data[0] as ThreadData);
						// Sort and notify on each load
						threads.sort((a, b) => {
							const dateA = new Date(a.thread.thread_metadata.create_timestamp);
							const dateB = new Date(b.thread.thread_metadata.create_timestamp);
							return dateB.getTime() - dateA.getTime();
						});
						onProgress([...threads]);
					}
				}
			} catch (error) {
				console.error(`Failed to load ${file}:`, error);
			}

			pending--;
			if (pending === 0) {
				resolve(threads);
			}
		});
	});
}

export function searchThreads(threads: ThreadData[], query: string): ThreadData[] {
	if (!query.trim()) {
		return threads;
	}

	const lowerQuery = query.toLowerCase();

	return threads.filter((threadData) => {
		// Search in thread name
		if (threadData.thread.name.toLowerCase().includes(lowerQuery)) {
			return true;
		}

		// Search in message content
		for (const message of threadData.messages) {
			if (message.content.toLowerCase().includes(lowerQuery)) {
				return true;
			}
		}

		return false;
	});
}

export async function loadChannelData(): Promise<ChannelData | null> {
	try {
		const response = await fetch(`${base}/data/channel_data.json`);
		if (response.ok) {
			const data = await response.json();
			if (Array.isArray(data) && data.length > 0) {
				return data[0];
			}
		}
	} catch (error) {
		console.error('Failed to load channel data:', error);
	}
	return null;
}

export function buildTagMap(tags: AvailableTag[]): Map<string, AvailableTag> {
	const map = new Map<string, AvailableTag>();
	for (const tag of tags) {
		map.set(tag.id, tag);
	}
	return map;
}
