<script lang="ts">
	import { goto } from '$app/navigation';
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

	import SpotifyEndpoint, { type Playlists } from '$lib/api';
	import { getContext, onMount } from 'svelte';

	const spotifyEndpoint = new SpotifyEndpoint();

	let isError = false;

	let playlists: Playlists;
	let selectedPlaylists: string[] = [];

	onMount(() => {
		spotifyEndpoint
			.getUserPlaylists()
			.then((_playlists) => {
				_playlists.items.sort((a, b) => a.name.localeCompare(b.name)); 
				playlists = _playlists;
			})
			.catch((error) => {
				console.error(error);
				isError = true;
			});
	});

	function checkboxUpdate(checkbox: EventTarget | null, playlistId: string) {
		if (!checkbox) return;
		const checked = (checkbox as HTMLInputElement).checked;
		if (checked) {
			selectedPlaylists.push(playlistId);
		} else {
			selectedPlaylists = selectedPlaylists.filter((id) => id !== playlistId);
		}
	}

	function preparePlaylistPage() {
		spotifyEndpoint.saveSelectedIDs(selectedPlaylists);
		goto('/playlists');
	}
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

		<p>Please choose the playlists you want to compare:</p>

		{#if playlists}
			<ul>
				{#each playlists.items as playlist}
					<li>
						<input
							type="checkbox"
							on:change={(event) => checkboxUpdate(event.target, playlist.id)}
						/>
						<span>
							{playlist.name}
						</span>
					</li>
				{/each}
			</ul>

			<button class="accent-btn" on:click={preparePlaylistPage}>Show playlists</button>
		{:else}
			<p>Loading...</p>
		{/if}
	{/if}
</div>
