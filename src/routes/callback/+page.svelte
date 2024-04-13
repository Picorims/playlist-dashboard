<script lang="ts">
	import SpotifyEndpoint from '$lib/api';
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

	let error: string | null = null;

	(async () => {
		await SpotifyEndpoint.callback((err) => {
			error = err;
		});

        console.log("All good!");
		goto("/home");
	})();
</script>

{#if error}
	<div class="container">
		<h1>Oops!</h1>

		<h2>Authentication failed!</h2>

		<p>
			{error}
		</p>
	</div>
{/if}

<style>
	div.container {
		text-align: center;
	}
</style>
