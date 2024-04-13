<script lang="ts">
	/*
    Playlist organizer is a tool to see how playlists are organized and modify them.
    Copyright (C) 2024  Charly Schmidt alias Picorims<picorims.contact@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

	import SpotifyEndpoint from '$lib/api';
	import { getContext, onMount } from 'svelte';

	const spotifyEndpoint = new SpotifyEndpoint();

	let isError = false;

	onMount(() => {
		spotifyEndpoint
			.getUserPlaylists()
			.then((playlists) => {
				console.log(playlists);
			})
			.catch((error) => {
				console.error(error);
				isError = true;
			});
	});
</script>

<div class="card">
	{#if isError}
		<h2>Oops!</h2>
		<p>
			Something went wrong while fetching your playlists. Please try again later or try to sign in
			again.
		</p>
	{:else}
		<h2>Welcome!</h2>
	{/if}
</div>
