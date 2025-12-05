<script lang="ts">
	import { onMount } from 'svelte';
	import { loadThreadsProgressively, searchThreads, loadChannelData, buildTagMap } from '$lib/data';
	import type { ThreadData, Message, ChannelData, AvailableTag } from '$lib/types';

	// Get thread files from server
	let { data } = $props();

	let threads = $state<ThreadData[]>([]);
	let filteredThreads = $state<ThreadData[]>([]);
	let selectedThread = $state<ThreadData | null>(null);
	let searchQuery = $state('');
	let selectedTags = $state<Set<string>>(new Set());
	let loading = $state(true);
	let channelData = $state<ChannelData | null>(null);
	let tagMap = $state<Map<string, AvailableTag>>(new Map());

	// Resizable sidebar
	let sidebarWidth = $state(384); // 24rem = 384px
	let isResizing = $state(false);
	const minWidth = 280;
	const maxWidth = 600;

	function startResize(e: MouseEvent) {
		isResizing = true;
		document.body.classList.add('resizing');
		e.preventDefault();
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isResizing) return;
		const newWidth = Math.min(maxWidth, Math.max(minWidth, e.clientX));
		sidebarWidth = newWidth;
	}

	function stopResize() {
		isResizing = false;
		document.body.classList.remove('resizing');
	}

	onMount(async () => {
		// Load channel data first to get tags
		channelData = await loadChannelData();
		if (channelData) {
			tagMap = buildTagMap(channelData.available_tags);
		}

		// Progressive loading - threads appear as they load
		await loadThreadsProgressively(data.threadFiles, (loadedThreads) => {
			threads = loadedThreads;
			filteredThreads = searchThreads(threads, searchQuery);
		});
		loading = false;
	});

	$effect(() => {
		let result = searchThreads(threads, searchQuery);
		// Filter by selected tags
		if (selectedTags.size > 0) {
			result = result.filter((threadData) => {
				const threadTags = threadData.thread.applied_tags || [];
				return Array.from(selectedTags).every((tagId) => threadTags.includes(tagId));
			});
		}
		filteredThreads = result;
	});

	function toggleTag(tagId: string) {
		const newTags = new Set(selectedTags);
		if (newTags.has(tagId)) {
			newTags.delete(tagId);
		} else {
			newTags.add(tagId);
		}
		selectedTags = newTags;
	}

	function clearTagFilters() {
		selectedTags = new Set();
	}

	function selectThread(thread: ThreadData) {
		selectedThread = thread;
	}

	function closeThread() {
		selectedThread = null;
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getAuthorName(message: Message): string {
		return message.author.global_name || message.author.username;
	}

	function getAvatarUrl(message: Message): string {
		if (message.author.avatar) {
			return `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png`;
		}
		return `https://cdn.discordapp.com/embed/avatars/${parseInt(message.author.discriminator || '0') % 5}.png`;
	}

	function sortMessages(messages: Message[]): Message[] {
		return [...messages].sort((a, b) => {
			return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
		});
	}

	function getThreadStarter(threadData: ThreadData): Message | null {
		if (threadData.messages.length === 0) return null;
		// Find the earliest message (thread starter)
		return [...threadData.messages].sort((a, b) =>
			new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
		)[0];
	}

	function getThreadStarterAvatarUrl(threadData: ThreadData): string {
		const starter = getThreadStarter(threadData);
		if (!starter) return 'https://cdn.discordapp.com/embed/avatars/0.png';
		return getAvatarUrl(starter);
	}

	function getThreadStarterName(threadData: ThreadData): string {
		const starter = getThreadStarter(threadData);
		if (!starter) return 'Unknown';
		return getAuthorName(starter);
	}

	// Format message content with code blocks and links
	function formatMessageContent(content: string): string {
		// Store code blocks and inline code temporarily to protect them from formatting
		const codeBlocks: string[] = [];
		const inlineCode: string[] = [];

		let formatted = content;

		// Extract and protect code blocks first (```language\ncode```)
		formatted = formatted.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
			const index = codeBlocks.length;
			// Escape HTML in code
			const escapedCode = code
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;');
			const langClass = lang ? ` data-lang="${lang}"` : '';
			codeBlocks.push(`<pre class="bg-gray-950 rounded-lg p-3 my-2 overflow-x-auto border border-gray-700"${langClass}><code class="text-sm text-gray-300">${escapedCode.trim()}</code></pre>`);
			return `%%CODEBLOCK_${index}%%`;
		});

		// Extract and protect inline code (`code`)
		formatted = formatted.replace(/`([^`]+)`/g, (match, code) => {
			const index = inlineCode.length;
			// Escape HTML in code
			const escapedCode = code
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;');
			inlineCode.push(`<code class="bg-gray-700 px-1.5 py-0.5 rounded text-sm text-pink-400">${escapedCode}</code>`);
			return `%%INLINECODE_${index}%%`;
		});

		// Now escape HTML in the rest of the content
		formatted = formatted
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');

		// Format URLs into clickable links
		formatted = formatted.replace(
			/(https?:\/\/[^\s<]+[^\s<.,;:!?"'\])}>])/g,
			'<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 hover:underline">$1</a>'
		);

		// Format bold (**text** or __text__)
		formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
		formatted = formatted.replace(/__([^_]+)__/g, '<strong class="font-semibold text-white">$1</strong>');

		// Format italic (*text* or _text_) - be careful not to match inside words
		formatted = formatted.replace(/(?<![*_\w])\*([^*]+)\*(?![*\w])/g, '<em class="italic">$1</em>');
		formatted = formatted.replace(/(?<![*_\w])_([^_]+)_(?![*\w])/g, '<em class="italic">$1</em>');

		// Restore inline code
		inlineCode.forEach((code, index) => {
			formatted = formatted.replace(`%%INLINECODE_${index}%%`, code);
		});

		// Restore code blocks
		codeBlocks.forEach((block, index) => {
			formatted = formatted.replace(`%%CODEBLOCK_${index}%%`, block);
		});

		return formatted;
	}

	// Color palette for tags
	const tagColors = [
		'bg-blue-600',
		'bg-purple-600',
		'bg-green-600',
		'bg-orange-600',
		'bg-pink-600',
		'bg-teal-600',
		'bg-indigo-600',
		'bg-cyan-600',
		'bg-amber-600',
		'bg-emerald-600',
		'bg-violet-600',
		'bg-rose-600',
		'bg-red-600'
	];

	function getTagColor(tagId: string): string {
		// Generate a consistent color based on tag ID
		let hash = 0;
		for (let i = 0; i < tagId.length; i++) {
			hash = ((hash << 5) - hash) + tagId.charCodeAt(i);
			hash = hash & hash;
		}
		return tagColors[Math.abs(hash) % tagColors.length];
	}

	function getTagInfo(tagId: string): { name: string; emoji: string | null; color: string } {
		const tag = tagMap.get(tagId);
		if (tag) {
			return {
				name: tag.name,
				emoji: tag.emoji_name,
				color: getTagColor(tagId)
			};
		}
		return { name: 'Tag', emoji: null, color: 'bg-gray-600' };
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="flex h-screen"
	onmousemove={handleMouseMove}
	onmouseup={stopResize}
	onmouseleave={stopResize}
>
	<!-- Sidebar - Thread List -->
	<div
		class="bg-gray-800 border-r border-gray-700 flex flex-col flex-shrink-0 relative"
		style="width: {sidebarWidth}px"
	>
		<!-- Resize handle -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors z-10"
			class:bg-blue-500={isResizing}
			onmousedown={startResize}
		></div>
		<!-- Header -->
		<div class="p-4 border-b border-gray-700">
			<h1 class="text-xl font-bold text-white mb-4">Infrahub Q&A</h1>
			<!-- Search -->
			<div class="relative">
				<input
					type="text"
					placeholder="Search threads..."
					bind:value={searchQuery}
					class="w-full bg-gray-700 text-gray-100 placeholder-gray-400 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<svg
					class="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					></path>
				</svg>
			</div>
			<!-- Tag Filter -->
			{#if channelData && channelData.available_tags.length > 0}
				<div class="mt-3">
					<div class="flex items-center justify-between mb-2">
						<span class="text-xs text-gray-400 uppercase tracking-wide">Filter by tags</span>
						{#if selectedTags.size > 0}
							<button
								onclick={clearTagFilters}
								class="text-xs text-blue-400 hover:text-blue-300"
							>
								Clear
							</button>
						{/if}
					</div>
					<div class="flex flex-wrap gap-1">
						{#each channelData.available_tags as tag}
							{@const isSelected = selectedTags.has(tag.id)}
							<button
								onclick={() => toggleTag(tag.id)}
								class="px-2 py-0.5 text-xs rounded transition-all {isSelected
									? getTagColor(tag.id) + ' text-white ring-2 ring-white/30'
									: 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
							>
								{#if tag.emoji_name}<span class="mr-1">{tag.emoji_name}</span>{/if}{tag.name}
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Thread List -->
		<div class="flex-1 overflow-y-auto">
			{#if loading}
				<div class="flex items-center justify-center h-32">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
				</div>
			{:else if filteredThreads.length === 0}
				<div class="p-4 text-gray-400 text-center">
					No threads found
				</div>
			{:else}
				{#each filteredThreads as threadData}
					<button
						onclick={() => selectThread(threadData)}
						class="w-full text-left p-4 hover:bg-gray-700 border-b border-gray-700 transition-colors {selectedThread?.thread.id === threadData.thread.id ? 'bg-gray-700' : ''}"
					>
						<h3 class="font-medium text-white truncate">{threadData.thread.name}</h3>
						{#if threadData.thread.applied_tags && threadData.thread.applied_tags.length > 0}
							<div class="flex flex-wrap gap-1 mt-1">
								{#each threadData.thread.applied_tags as tagId}
									{@const tag = getTagInfo(tagId)}
									<span class="px-2 py-0.5 text-xs rounded {tag.color} text-white">
										{#if tag.emoji}<span class="mr-1">{tag.emoji}</span>{/if}{tag.name}
									</span>
								{/each}
							</div>
						{/if}
						<div class="text-sm text-blue-400 mt-1">{getThreadStarterName(threadData)}</div>
						<div class="flex items-center gap-2 mt-1 text-sm text-gray-400">
							<span>{threadData.messages.length} messages</span>
							<span>•</span>
							<span>{formatDate(threadData.thread.thread_metadata.create_timestamp)}</span>
						</div>
						{#if threadData.messages.length > 0}
							{@const starter = getThreadStarter(threadData)}
							{#if starter}
								<p class="text-sm text-gray-500 mt-2 line-clamp-2">
									{starter.content.slice(0, 100)}{starter.content.length > 100 ? '...' : ''}
								</p>
							{/if}
						{/if}
					</button>
				{/each}
			{/if}
		</div>

		<!-- Footer -->
		<div class="p-3 border-t border-gray-700 text-sm text-gray-400">
			{filteredThreads.length} threads
		</div>
	</div>

	<!-- Main Content - Thread Messages -->
	<div class="flex-1 flex flex-col bg-gray-900">
		{#if selectedThread}
			<!-- Thread Header -->
			<div class="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-800">
				<div>
					<h2 class="text-lg font-semibold text-white">{selectedThread.thread.name}</h2>
					{#if selectedThread.thread.applied_tags && selectedThread.thread.applied_tags.length > 0}
						<div class="flex flex-wrap gap-1 mt-1">
							{#each selectedThread.thread.applied_tags as tagId}
								{@const tag = getTagInfo(tagId)}
								<span class="px-2 py-0.5 text-xs rounded {tag.color} text-white">
									{#if tag.emoji}<span class="mr-1">{tag.emoji}</span>{/if}{tag.name}
								</span>
							{/each}
						</div>
					{/if}
					<p class="text-sm text-gray-400 mt-1">
						Created {formatDate(selectedThread.thread.thread_metadata.create_timestamp)}
						{#if selectedThread.thread.thread_metadata.archived}
							<span class="ml-2 px-2 py-0.5 bg-yellow-600 text-yellow-100 text-xs rounded">Archived</span>
						{/if}
						{#if selectedThread.thread.thread_metadata.locked}
							<span class="ml-2 px-2 py-0.5 bg-red-600 text-red-100 text-xs rounded">Locked</span>
						{/if}
					</p>
				</div>
				<button
					onclick={closeThread}
					aria-label="Close thread"
					class="p-2 hover:bg-gray-700 rounded-lg transition-colors"
				>
					<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>

			<!-- Messages -->
			<div class="flex-1 overflow-y-auto p-4 space-y-4">
				{#each sortMessages(selectedThread.messages) as message}
					<div class="flex gap-3">
						<img
							src={getAvatarUrl(message)}
							alt={getAuthorName(message)}
							class="w-10 h-10 rounded-full flex-shrink-0"
						/>
						<div class="flex-1 min-w-0">
							<div class="flex items-baseline gap-2">
								<span class="font-medium text-white">{getAuthorName(message)}</span>
								<span class="text-xs text-gray-500">{formatDate(message.timestamp)}</span>
							</div>
							<div class="mt-1 text-gray-300 whitespace-pre-wrap break-words message-content">
								{@html formatMessageContent(message.content)}
							</div>

							<!-- Attachments -->
							{#if message.attachments && message.attachments.length > 0}
								<div class="mt-2 space-y-2">
									{#each message.attachments as attachment}
										<a
											href={attachment.url}
											target="_blank"
											rel="noopener noreferrer"
											class="inline-flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
										>
											<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
											</svg>
											<span class="text-sm text-blue-400">{attachment.filename}</span>
										</a>
									{/each}
								</div>
							{/if}

							<!-- Embeds -->
							{#if message.embeds && message.embeds.length > 0}
								<div class="mt-2 space-y-2">
									{#each message.embeds as embed}
										{#if embed.url}
											<a
												href={embed.url}
												target="_blank"
												rel="noopener noreferrer"
												class="block p-3 bg-gray-800 border-l-4 border-blue-500 rounded"
											>
												{#if embed.title}
													<div class="font-medium text-blue-400">{embed.title}</div>
												{/if}
												{#if embed.description}
													<div class="text-sm text-gray-400 mt-1">{embed.description}</div>
												{/if}
											</a>
										{/if}
									{/each}
								</div>
							{/if}

							<!-- Reactions -->
							{#if message.reactions && message.reactions.length > 0}
								<div class="mt-2 flex flex-wrap gap-1">
									{#each message.reactions as reaction}
										<span class="inline-flex items-center gap-1 px-2 py-1 bg-gray-700 rounded text-sm">
											<span>{reaction.emoji.name}</span>
											<span class="text-gray-400">{reaction.count}</span>
										</span>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<!-- Empty State -->
			<div class="flex-1 flex items-center justify-center">
				<div class="text-center">
					<svg class="mx-auto h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
					</svg>
					<h3 class="mt-2 text-sm font-medium text-gray-400">Select a thread</h3>
					<p class="mt-1 text-sm text-gray-500">Choose a thread from the list to view messages</p>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	:global(body.resizing) {
		cursor: col-resize !important;
		user-select: none;
	}

	/* Custom scrollbar styling */
	:global(*) {
		scrollbar-width: thin;
		scrollbar-color: #4b5563 #1f2937;
	}

	:global(*::-webkit-scrollbar) {
		width: 8px;
		height: 8px;
	}

	:global(*::-webkit-scrollbar-track) {
		background: #1f2937;
		border-radius: 4px;
	}

	:global(*::-webkit-scrollbar-thumb) {
		background: #4b5563;
		border-radius: 4px;
	}

	:global(*::-webkit-scrollbar-thumb:hover) {
		background: #6b7280;
	}

	:global(*::-webkit-scrollbar-corner) {
		background: #1f2937;
	}

	/* Message content styling */
	.message-content :global(pre) {
		white-space: pre-wrap;
		word-wrap: break-word;
	}

	.message-content :global(code) {
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
	}

	.message-content :global(a) {
		word-break: break-all;
	}
</style>
