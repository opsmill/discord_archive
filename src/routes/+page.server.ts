import { readdir } from 'fs/promises';
import { join } from 'path';

export async function load() {
	const dataDir = join(process.cwd(), 'static', 'data');

	try {
		const files = await readdir(dataDir);
		const threadFiles = files.filter(f =>
			f.endsWith('.json') &&
			f !== 'channel_data.json'
		);

		return {
			threadFiles
		};
	} catch (error) {
		console.error('Failed to read data directory:', error);
		return {
			threadFiles: []
		};
	}
}
