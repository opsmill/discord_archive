import { writable } from 'svelte/store';
import type { ThreadData } from './types';

export const selectedThread = writable<ThreadData | null>(null);
export const searchQuery = writable<string>('');
