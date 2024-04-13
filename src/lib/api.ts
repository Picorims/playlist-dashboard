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

import Config from './config';

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

export interface APIError {
	status: number;
	message: string;
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
    }
    type: "playlist";
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

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

class Environment {
	public static readonly redirectUri = 'http://localhost:5173/callback';
	public static readonly tokenUrl = 'https://accounts.spotify.com/api/token';
	public static readonly clientId = Config.publicId;
	public static readonly baseUrl = 'https://api.spotify.com/v1/';
}

class SpotifyEndpoint {
	// https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow#request-user-authorization
	private static tokenData: TokenData | null = null;

	private static generateRandomString(length: number): string {
		const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		const values = crypto.getRandomValues(new Uint8Array(length));
		return values.reduce((acc, x) => acc + possible[x % possible.length], '');
	}

	private static async sha256(plain: string) {
		const encoder = new TextEncoder();
		const data = encoder.encode(plain);
		return window.crypto.subtle.digest('SHA-256', data);
	}

	private static base64encode(input: ArrayBuffer) {
		return btoa(String.fromCharCode(...new Uint8Array(input)))
			.replace(/=/g, '')
			.replace(/\+/g, '-')
			.replace(/\//g, '_');
	}

	public static async launchSpotifyAuth() {
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
	 * @param onerror called in case of a request error
	 * @returns
	 */
	public static async callback(onerror: (error: string | null) => void) {
		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.has('error')) {
			onerror(urlParams.get('error'));
			console.error('Authentication error: ' + urlParams.get('error'));
			return;
		}

		const code = urlParams.get('code');
		if (!code) {
			onerror('No code in URL');
			console.error('No code in URL');
			return;
		} else {
			this.getFirstToken(code, onerror);
		}
	}

	/**
	 * Initialize the token data
	 * @param code provided by callback
	 * @param onerror in case of a request error
	 * @returns
	 */
	private static async getFirstToken(code: string, onerror: (error: string) => void) {
		// stored in the previous step
		const codeVerifier = localStorage.getItem('code_verifier');
		if (!codeVerifier) {
			onerror('No code verifier in local storage');
			console.error('No code verifier in local storage');
			return;
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
			onerror('Failed to get token');
			console.error('Failed to get token');
			return;
		}
		const response = await body.json();

		if (response.error) {
			onerror(response.error + ': ' + response.error_description);
			console.error(response.error + ': ' + response.error_description);
			return;
		}

		this.tokenData = { token: response as Token, lastRefresh: new Date() };
		console.log(response);
	}

	private static async getRefreshToken() {
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
	private static async getCurrentToken() {
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
	 * @param onerror
	 */
	private static async fetchSpotifyApi(
		url: string,
		method: HTTPMethod,
		body: Record<string, string>,
		onerror: (error: APIError) => void = this.defaultOnError
	) {
		const token = await this.getCurrentToken();
		const payload = {
			method,
			headers: {
				Authorization: `Bearer ${token}`
			},
			body: new URLSearchParams(body)
		};

		const response = await fetch(Environment.baseUrl + url, payload);
		const JSON = await response.json();
		if (response.status >= 200 && response.status < 300) {
			return JSON;
		} else {
			onerror(JSON.error);
			return null;
		}
	}

	private static defaultOnError(error: APIError) {
		console.error(`Error ${error.status}: ${error.message}`);
	}

	public static async getUserPlaylists(limit: number = 20, offset: number = 0): Promise<Playlists | null> {
		return this.fetchSpotifyApi('me/playlists', 'GET', {
			limit: limit.toString(),
			offset: offset.toString()
		});
	}
}

export default SpotifyEndpoint;
