<script lang="ts">
	import SpotifyEndpoint from '$lib/api';
	import { getContext, onMount } from 'svelte';

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

	function launchAuth() {
          console.log(spotifyEndpoint);
          spotifyEndpoint.launchSpotifyAuth();
	}
</script>

<div class="container card">
	<h2>A tool to help you organize your playlists!</h2>

	<p>
		This tool was created for private use. No ID or key is provided, and you should create your own
		config if you want to use it. Sorry!
	</p>

	<button class="accent-btn" on:click={launchAuth}>Sign in with Spotify</button>
</div>

<style>
	div.container {
		text-align: center;
	}
</style>
