<script lang="ts">
	import SpotifyEndpoint, { type PlaylistProgress } from '$lib/api';
	import type { SongTable } from '$lib/cache';
	import { onMount } from 'svelte';

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

	const spotifyEndpoint = new SpotifyEndpoint();
	let progress: PlaylistProgress = { playlist: { pos: 0, total: 1 }, items: { pos: 0, total: 1 } };
	let loading = true;
	let table: Readonly<SongTable> | null = null;
	const selectedPlaylists = spotifyEndpoint.selectedIDs;

	onMount(() => {
		spotifyEndpoint
			.cacheSelectedPlaylists((progressUpdate) => {
				progress = progressUpdate;
				console.log(progress);
			})
			.then(() => {
				table = spotifyEndpoint.getSongTable();
			})
			.finally(() => {
				loading = false;
				console.log(spotifyEndpoint);
			});
	});
</script>

<div class="container card">
	{#if loading}
		<p>Processing playlist {progress.playlist.pos} of {progress.playlist.total}</p>
		<progress max="100" value={(progress.playlist.pos / progress.playlist.total) * 100}></progress>
		<p>Processing items {progress.items.pos} of {progress.items.total}</p>
		<progress max="100" value={(progress.items.pos / progress.items.total) * 100}></progress>
	{:else if table === null}
		<span>An error occured during playlist caching, see logs</span>
	{:else}
		<table>
			<thead>
				<tr>
					<th class="track"><span>Track</span></th>
					<th class="artist"><span>Artist</span></th>
					<th class="album"><span>Album</span></th>
					{#each selectedPlaylists as playlistId}
						<th>{spotifyEndpoint.getPlaylist(playlistId)?.name}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each table as [trackId, booleans]}
					<tr>
						<td class="track"><span>{spotifyEndpoint.getTrack(trackId)?.name}</span></td>
						<td class="artist">
							<span
								>{spotifyEndpoint
									.getTrack(trackId)
									?.artists.map((artist) => artist.name)
									.join(', ')}
							</span>
						</td>
						<td class="album">
							<div>
								<span>{spotifyEndpoint.getTrack(trackId)?.album.name}</span>
								<img
									width="40"
									height="40"
									src={spotifyEndpoint.getTrack(trackId)?.album.images[0]?.url}
									alt={spotifyEndpoint.getTrack(trackId)?.album.name}
								/>
							</div>
						</td>
						{#each selectedPlaylists as playlistId}
							<td class="checkbox">
								<input type="checkbox" checked={booleans.get(playlistId)} />
							</td>
						{/each}
					</tr>{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	div.container {
		overflow-x: scroll;
		overflow-y: scroll;
		max-height: 60vh; /*adjusting based on max content available space is tricky, this works for now*/
	}
	table {
		width: 100%;
		max-width: 100%;
		--th-max-height: 50px;
		border-collapse: collapse;
	}
	th {
		position: sticky;
		top: -1rem; /*moves up on scroll*/
		background-color: var(--background-100);
	}
	th,
	td {
		padding: 0.5rem;
		max-height: var(--th-max-height);
		overflow: hidden;
		border-left: 1px solid var(--primary-800);
		border-right: 1px solid var(--primary-800);
	}
	th span,
	td span {
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2; /* number of lines to show */
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}
	th.album,
	td.album {
		min-width: 150px;
		max-width: 20vw;
		word-wrap: break-word;
	}
	th.artist,
	td.artist {
		min-width: 150px;
		max-width: 20vw;
		word-wrap: break-word;
	}
	th.track,
	td.track {
		min-width: 150px;
		max-width: 20vw;
		word-wrap: break-word;
	}

	tr:nth-child(even) {
		background-color: var(--background-200);
	}
	tr:nth-child(odd) {
		background-color: var(--background-100);
	}

	td.album > div {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	td.checkbox {
		text-align: center;
	}
</style>
