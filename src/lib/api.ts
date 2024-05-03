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

import { getContext } from 'svelte';
import { APICache, SpotifyAppCache, type SongTable } from './cache';
import Config from './config';
import { get, type Writable } from 'svelte/store';

export interface Token {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token: string;
	scope: string;
}

export interface TokenData {
	token: Token;
	lastRefresh: Date;
}

export interface APIErrorJSON {
	status: number;
	message: string;
}

class APIError extends Error {
	constructor(public json: APIErrorJSON) {
		super(json.message);
		Object.setPrototypeOf(this, APIError.prototype);
	}
}

export interface Playlist {
	// https://developer.spotify.com/documentation/web-api/reference/get-a-list-of-current-users-playlists
	collaborative: boolean;
	description: string;
	external_urls: {
		spotify: string;
	};
	href: string;
	id: string;
	images: {
		url: string;
		height: number | null;
		width: number | null;
	}[];
	name: string;
	owner: {
		external_urls: {
			spotify: string;
		};
		followers: {
			href: string | null;
			total: number;
		};
		href: string;
		id: string;
		type: string;
		uri: string;
		display_name: string | null;
	};
	public: boolean;
	snapshot_id: string;
	tracks: {
		href: string;
		total: number;
	};
	type: 'playlist';
	uri: string;
}

export interface Playlists {
	href: string;
	limit: number;
	next: string | null;
	offset: number;
	previous: string | null;
	total: number;
	items: Playlist[];
}

/**
 * Incomplete, only contains the fields needed for the app
 */
export interface PlaylistItem {
	// https://developer.spotify.com/documentation/web-api/reference/playlists/get-playlists-tracks/
	track: {
		album: {
			images: {
				url: string;
				height: number | null;
				width: number | null;
			}[];
			name: string;
		}
		artists: Artist[];
		duration_ms: number;
		href: string;
		name: string;
		preview_url: string | null;
		is_local: boolean;
		id: string;
	};
}

export interface Artist {
	name: string;
}

export interface PlaylistProgress {
	playlist: { pos: number; total: number };
	items: { pos: number; total: number };
}

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

class Environment {
	public static readonly redirectUri = 'http://localhost:5173/callback';
	public static readonly tokenUrl = 'https://accounts.spotify.com/api/token';
	public static readonly clientId = Config.publicId;
	public static readonly baseUrl = 'https://api.spotify.com/v1/';
}

class SpotifyEndpoint {
	// https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow#request-user-authorization
	private tokenStore: Writable<TokenData | null>;
	private apiCacheStore: Writable<APICache>;
	private spotifyAppCacheStore: Writable<SpotifyAppCache>;
	private _tokenData: TokenData | null = null;
	private _cache: APICache = new APICache();
	private _spotifyAppCache: SpotifyAppCache = new SpotifyAppCache();

	private get tokenData(): TokenData | null {
		return this._tokenData;
	}
	private set tokenData(value: TokenData | null) {
		this._tokenData = value;
		this.tokenStore.set(value);
	}
	private get cache(): APICache {
		return this._cache;
	}
	private set cache(value: APICache) {
		this._cache = value;
		this.apiCacheStore.set(value);
	}
	private get spotifyAppCache(): SpotifyAppCache {
		return this._spotifyAppCache;
	}
	private set spotifyAppCache(value: SpotifyAppCache) {
		this._spotifyAppCache = value;
		this.spotifyAppCacheStore.set(value);
	}

	public getPlaylist(id: string): Playlist | null {
		return this.cache.playlistMap.get(id) ?? null;
	}

	public getTrack(id: string): PlaylistItem["track"] | null {
		return this.cache.trackMap.get(id)?.track ?? null;
	}

	/**
	 * Note: do not mutate the returned object
	 * @returns the song table
	 */
	public getSongTable(): Readonly<SongTable> {
		if (this.spotifyAppCache.songTable.size === 0) {
			this.buildSongTable();
		}
		return this.spotifyAppCache.songTable;
	}

	get selectedIDs(): readonly string[] {
		return this.spotifyAppCache.selectedIDs;
	}

	constructor() {
		this.tokenStore = getContext('tokenStore');
		this.apiCacheStore = getContext('apiCacheStore');
		this.spotifyAppCacheStore = getContext('spotifyAppCacheStore');

		this._tokenData = get(this.tokenStore);
		this._cache = get(this.apiCacheStore);
		this._spotifyAppCache = get(this.spotifyAppCacheStore);

		// this.tokenStore.subscribe((value) => {
		// 	console.log('tokenStore', value);
		// });
		// this.apiCacheStore.subscribe((value) => {
		// 	console.log('apiCacheStore', value);
		// });
		// this.spotifyAppCacheStore.subscribe((value) => {
		// 	console.log('spotifyAppCacheStore', value);
		// });
	}

	private generateRandomString(length: number): string {
		const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		const values = crypto.getRandomValues(new Uint8Array(length));
		return values.reduce((acc, x) => acc + possible[x % possible.length], '');
	}

	private async sha256(plain: string) {
		const encoder = new TextEncoder();
		const data = encoder.encode(plain);
		return window.crypto.subtle.digest('SHA-256', data);
	}

	private base64encode(input: ArrayBuffer) {
		return btoa(String.fromCharCode(...new Uint8Array(input)))
			.replace(/=/g, '')
			.replace(/\+/g, '-')
			.replace(/\//g, '_');
	}

	public async launchSpotifyAuth() {
		const codeVerifier = this.generateRandomString(64);
		const hashed = await this.sha256(codeVerifier);
		const codeChallenge = this.base64encode(hashed);

		const scope = 'user-read-private playlist-read-private';
		const authUrl = new URL('https://accounts.spotify.com/authorize');

		// generated in the previous step
		window.localStorage.setItem('code_verifier', codeVerifier);

		const params = {
			response_type: 'code',
			client_id: Environment.clientId,
			scope,
			code_challenge_method: 'S256',
			code_challenge: codeChallenge,
			redirect_uri: Environment.redirectUri
		};

		authUrl.search = new URLSearchParams(params).toString();
		window.location.href = authUrl.toString();
	}

	/**
	 * Handle spotify authentication redirection
	 * @returns
	 */
	public async callback() {
		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.has('error')) {
			throw new Error('Authentication error: ' + urlParams.get('error'));
		}

		const code = urlParams.get('code');
		if (!code) {
			throw new Error('No code in URL');
		} else {
			await this.getFirstToken(code);
		}
	}

	/**
	 * Initialize the token data
	 * @param code provided by callback
	 * @returns
	 */
	private async getFirstToken(code: string) {
		// stored in the previous step
		const codeVerifier = localStorage.getItem('code_verifier');
		if (!codeVerifier) {
			throw new Error('No code verifier in local storage');
		}

		const payload = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({
				client_id: Environment.clientId,
				grant_type: 'authorization_code',
				code,
				redirect_uri: Environment.redirectUri,
				code_verifier: codeVerifier as string
			})
		};

		const body = await fetch(Environment.tokenUrl, payload);
		if (body.status !== 200) {
			throw new Error('Failed to get token');
		}
		const response = await body.json();

		if (response.error) {
			throw new Error(response.error + ': ' + response.error_description);
		}

		this.tokenData = { token: response as Token, lastRefresh: new Date() };
		console.log(response);
	}

	private async getRefreshToken() {
		// refresh token that has been previously stored
		const refreshToken = this.tokenData?.token.refresh_token;

		if (!refreshToken) {
			throw new Error('No refresh token');
		} else {
			const payload = {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: new URLSearchParams({
					grant_type: 'refresh_token',
					refresh_token: refreshToken,
					client_id: Environment.clientId
				})
			};
			const body = await fetch(Environment.tokenUrl, payload);
			if (body.status !== 200) {
				console.error('Failed to get token');
				return;
			}
			const response = await body.json();

			if (response.error) {
				console.error(response.error + ': ' + response.error_description);
				return;
			}

			this.tokenData = { token: response as Token, lastRefresh: new Date() };
		}
	}

	/**
	 *
	 * @returns the current token, refresh it using the refresh token if needed
	 */
	private async getCurrentToken() {
		if (!this.tokenData) {
			throw new Error('No token');
		}

		const now = new Date();
		const lastRefresh = this.tokenData.lastRefresh;

		if (now.getTime() - lastRefresh.getTime() > this.tokenData.token.expires_in * 1000) {
			await this.getRefreshToken();
		}

		return this.tokenData.token.access_token;
	}

	/**
	 * generic API call
	 * @param url
	 */
	private async fetchSpotifyApi(url: string, method: HTTPMethod, body: Record<string, string>) {
		console.log('fetchSpotifyApi', url, method, body);
		const token = await this.getCurrentToken();
		const payload = {
			method,
			headers: {
				Authorization: `Bearer ${token}`
			},
			body: method === 'GET' ? undefined : new URLSearchParams(body)
		};

		let fetchURL = Environment.baseUrl + url;
		if (method === 'GET') {
			fetchURL += '?' + new URLSearchParams(body);
		}

		const response = await fetch(fetchURL, payload);
		const json = await response.json();
		console.log('fetchSpotifyApi', url, method, "response: ", json);
		if (response.status >= 200 && response.status < 300) {
			return json;
		} else {
			throw new APIError(json);
		}
	}

	public async getUserPlaylists(limit: number = 50, offset: number = 0): Promise<Playlists> {
		if (this.cache.playlists) {
			return this.cache.playlists;
		}

		const response = await this.fetchSpotifyApi('me/playlists', 'GET', {
			limit: limit.toString(),
			offset: offset.toString()
		});
		if (response) {
			this.cache.playlists = response;
			// eslint-disable-next-line no-self-assign
			this.cache = this.cache; // update store
		}

		for (const playlist of response.items) {
			this.cache.playlistMap.set(playlist.id, playlist);
		}

		return response;
	}

	private async getPlaylistItems(
		limit: number = 50,
		offset: number = 0,
		id: string
	): Promise<[PlaylistItem[], number, boolean]> {
		if (this.cache.playlistItems[id] && this.cache.playlistItems[id].length > offset) {
			return [this.cache.playlistItems[id].slice(offset, offset + limit), this.cache.playlistItems[id].length, true]; // from cache ?
		}

		const response = await this.fetchSpotifyApi(`playlists/${id}/tracks`, 'GET', {
			limit: limit.toString(),
			offset: offset.toString()
		});

		if (!response.items) {
			throw new Error('No items in response');
		}

		for (const item of response.items) {
			this.cache.trackMap.set(item.track.id, item);
			// eslint-disable-next-line no-self-assign
			this.cache = this.cache;
		}

		return [response.items, response.total, false]; // from cache ?
	}

	public saveSelectedIDs(ids: string[]) {
		this.spotifyAppCache.selectedIDs = [...ids];
		// eslint-disable-next-line no-self-assign
		this.spotifyAppCache = this.spotifyAppCache;
	}

	public async cacheSelectedPlaylists(progressCallback: (progress: PlaylistProgress) => void | undefined) {
		const ids = this.spotifyAppCache.selectedIDs;
		for (let i = 0; i < ids.length; i++) {
			const id = ids[i];
			if (progressCallback) {
				progressCallback({ playlist: { pos: i, total: ids.length }, items: { pos: 0, total: 100_000 } });
			}
			if (!this.cache.playlistItems[id]) {
				this.cache.playlistItems[id] = [];
				let done = false;
				let offset = 0;
				const LIMIT = 50;
				while (!done) {
					const response = await this.getPlaylistItems(LIMIT, offset, id);
					if (response) {
						const [items, total, fromCache] = response;
						if (!fromCache) this.cache.playlistItems[id] = this.cache.playlistItems[id].concat(items);
						// eslint-disable-next-line no-self-assign
						this.cache = this.cache;
						if (progressCallback) {
							progressCallback({ playlist: { pos: i, total: ids.length }, items: { pos: offset, total: total } });
						}
						if (offset >= total) {
							done = true;
						} else {
							offset += LIMIT;
						}
					}
				}

				// eslint-disable-next-line no-self-assign
				this.cache = this.cache;
			}
		}

		this.buildSongTable();
	}

	private buildSongTable() {
		const table: SongTable = new Map();
		const playlistIds = this.selectedIDs;
		for (const pid of playlistIds) {
			console.log('buildSongTable', pid, this.cache.playlistItems[pid]);
			for (const item of this.cache.playlistItems[pid]) {
				if (!table.has(item.track.id)) {
					const m = new Map();
					for (const pid2 of playlistIds) {
						m.set(pid2, false);
					}
					table.set(item.track.id, m);
				}
				table.get(item.track.id)?.set(pid, true);				
			}
		}

		console.log('buildSongTable', table);

		this.spotifyAppCache.songTable = table;
		// eslint-disable-next-line no-self-assign
		this.spotifyAppCache = this.spotifyAppCache;

		return table;
	}
}

export default SpotifyEndpoint;
