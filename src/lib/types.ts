export interface Author {
	id: string;
	username: string;
	avatar: string | null;
	discriminator: string;
	global_name: string | null;
}

export interface Attachment {
	id: string;
	filename: string;
	size: number;
	url: string;
	content_type?: string;
}

export interface Embed {
	type: string;
	url?: string;
	title?: string;
	description?: string;
}

export interface Reaction {
	emoji: {
		id: string | null;
		name: string;
	};
	count: number;
}

export interface Message {
	id: string;
	type: number;
	content: string;
	author: Author;
	timestamp: string;
	edited_timestamp: string | null;
	attachments: Attachment[];
	embeds: Embed[];
	reactions?: Reaction[];
	pinned: boolean;
}

export interface ThreadMetadata {
	archived: boolean;
	archive_timestamp: string;
	auto_archive_duration: number;
	locked: boolean;
	create_timestamp: string;
}

export interface Thread {
	id: string;
	name: string;
	type: number;
	owner_id: string;
	parent_id: string;
	message_count: number;
	thread_metadata: ThreadMetadata;
	applied_tags?: string[];
}

export interface ThreadData {
	thread: Thread;
	messages: Message[];
}

export interface AvailableTag {
	id: string;
	name: string;
	moderated: boolean;
	emoji_id: string | null;
	emoji_name: string | null;
}

export interface ChannelData {
	id: string;
	name: string;
	topic: string;
	available_tags: AvailableTag[];
}
