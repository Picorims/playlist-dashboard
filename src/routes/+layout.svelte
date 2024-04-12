
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

	import type { TokenData } from '$lib/api';
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';

	// Create a store...
	const tokenStore = writable<TokenData>();

	// ...and add it to the context for child components to access
	setContext('tokenStore', tokenStore);
</script>

<slot />

<style>
	/*https://www.realtimecolors.com/?colors=d4f8f6-051d1c-86ebea-471994-29ece2&fonts=Poppins-Poppins*/
	@media (prefers-color-scheme: light) {
		:root {
			--text: #072c2a;
			--background: #e0faf9;
			--primary: #147b79;
			--secondary: #986be6;
			--accent: #13d8ce;
		}
	}
	@media (prefers-color-scheme: dark) {
		:root {
			--text: #d4f8f6;
			--background: #051d1c;
			--primary: #86ebea;
			--secondary: #471994;
			--accent: #29ece2;
		}
	}

	@media (prefers-color-scheme: light) {
		:root {
			--text-50: #e9fcfb;
			--text-100: #d3f8f6;
			--text-200: #a7f1ee;
			--text-300: #7beae5;
			--text-400: #4fe3dc;
			--text-500: #22ddd3;
			--text-600: #1cb0a9;
			--text-700: #15847f;
			--text-800: #0e5855;
			--text-900: #072c2a;
			--text-950: #031615;

			--background-50: #e9fbfb;
			--background-100: #d3f8f7;
			--background-200: #a7f1ee;
			--background-300: #7beae6;
			--background-400: #50e2de;
			--background-500: #24dbd5;
			--background-600: #1dafab;
			--background-700: #158480;
			--background-800: #0e5855;
			--background-900: #072c2b;
			--background-950: #041615;

			--primary-50: #e9fbfb;
			--primary-100: #d3f8f7;
			--primary-200: #a7f1ef;
			--primary-300: #7beae8;
			--primary-400: #50e2e0;
			--primary-500: #24dbd8;
			--primary-600: #1dafad;
			--primary-700: #158482;
			--primary-800: #0e5856;
			--primary-900: #072c2b;
			--primary-950: #041616;

			--secondary-50: #f0e9fb;
			--secondary-100: #e1d3f8;
			--secondary-200: #c2a8f0;
			--secondary-300: #a47ce9;
			--secondary-400: #8651e1;
			--secondary-500: #6725da;
			--secondary-600: #531eae;
			--secondary-700: #3e1683;
			--secondary-800: #290f57;
			--secondary-900: #15072c;
			--secondary-950: #0a0416;

			--accent-50: #e8fdfc;
			--accent-100: #d0fbf9;
			--accent-200: #a1f7f3;
			--accent-300: #72f3ec;
			--accent-400: #43efe6;
			--accent-500: #14ebe0;
			--accent-600: #10bcb3;
			--accent-700: #0c8d86;
			--accent-800: #085e5a;
			--accent-900: #042f2d;
			--accent-950: #021716;
		}
	}
	@media (prefers-color-scheme: dark) {
		:root {
			--text-50: #041615;
			--text-100: #072c2a;
			--text-200: #0e5854;
			--text-300: #15847e;
			--text-400: #1dafa8;
			--text-500: #24dbd2;
			--text-600: #50e2db;
			--text-700: #7beae4;
			--text-800: #a7f1ed;
			--text-900: #d3f8f6;
			--text-950: #e9fbfb;

			--background-50: #041615;
			--background-100: #072c2a;
			--background-200: #0f5755;
			--background-300: #16837f;
			--background-400: #1eaeaa;
			--background-500: #25dad4;
			--background-600: #51e1dd;
			--background-700: #7ce9e5;
			--background-800: #a8f0ee;
			--background-900: #d3f8f6;
			--background-950: #e9fbfb;

			--primary-50: #041616;
			--primary-100: #072c2b;
			--primary-200: #0e5856;
			--primary-300: #158482;
			--primary-400: #1dafad;
			--primary-500: #24dbd8;
			--primary-600: #50e2e0;
			--primary-700: #7beae8;
			--primary-800: #a7f1ef;
			--primary-900: #d3f8f7;
			--primary-950: #e9fbfb;

			--secondary-50: #0a0416;
			--secondary-100: #15072c;
			--secondary-200: #290f57;
			--secondary-300: #3e1683;
			--secondary-400: #531eae;
			--secondary-500: #6725da;
			--secondary-600: #8651e1;
			--secondary-700: #a47ce9;
			--secondary-800: #c2a8f0;
			--secondary-900: #e1d3f8;
			--secondary-950: #f0e9fb;

			--accent-50: #021716;
			--accent-100: #042f2d;
			--accent-200: #085e5a;
			--accent-300: #0c8d86;
			--accent-400: #10bcb3;
			--accent-500: #14ebe0;
			--accent-600: #43efe6;
			--accent-700: #72f3ec;
			--accent-800: #a1f7f3;
			--accent-900: #d0fbf9;
			--accent-950: #e8fdfc;
		}
	}

	:root {
		font-family: Verdana, Geneva, Tahoma, sans-serif;
		background-color: var(--background);
		color: var(--text);

		--radius-small: 4px;
	}

	:global(button) {
		font-size: 1.1rem;
		padding: 0.25em 0.5em;
		border-radius: var(--radius-small);
		color: var(--background);
		background-color: var(--primary);
		border: none;
		transition: 0.1s;
	}

	:global(button:hover) {
		cursor: pointer;
		transform: scale(1.1);
		transition: 0.1s;
	}
</style>