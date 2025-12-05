<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="min-h-screen bg-gray-900 text-gray-100">
	{@render children()}
</div>
