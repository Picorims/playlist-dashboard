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

class SpotifyEndpoint {
	// https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow#request-user-authorization
    private static readonly clientId = Config.publicId;
    private static readonly redirectUri = 'http://localhost:5173/callback';
    private static readonly tokenUrl = 'https://accounts.spotify.com/api/token';
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

		const scope = 'user-read-private';
		const authUrl = new URL('https://accounts.spotify.com/authorize');

		// generated in the previous step
		window.localStorage.setItem('code_verifier', codeVerifier);

		const params = {
			response_type: 'code',
			client_id: this.clientId,
			scope,
			code_challenge_method: 'S256',
			code_challenge: codeChallenge,
			redirect_uri: this.redirectUri
		};

		authUrl.search = new URLSearchParams(params).toString();
		window.location.href = authUrl.toString();
	}

	public static async callback(onerror: (error: string | null) => void){
		const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('error')) {
            onerror(urlParams.get('error'));
            console.error("Authentication error: " + urlParams.get('error'));
            return;
        }
        
        const code = urlParams.get('code');
        if (!code) {
            onerror("No code in URL");
            console.error("No code in URL");
            return;
        } else {
            this.getFirstToken(code, onerror);
        }

	}

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
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: this.clientId,
            grant_type: 'authorization_code',
            code,
            redirect_uri: this.redirectUri,
            code_verifier: codeVerifier as string,
          }),
        }
      
        const body = await fetch(this.tokenUrl, payload);
        if (body.status !== 200) {
            onerror('Failed to get token');
            console.error('Failed to get token');
            return;
        }
        const response = await body.json();

        if (response.error) {
            onerror(response.error + ": " + response.error_description);
            console.error(response.error + ": " + response.error_description);
            return;
        }
      
        this.tokenData = {token: response as Token, lastRefresh: new Date()};
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
                client_id: this.clientId
              }),
            }
            const body = await fetch(this.tokenUrl, payload);
            if (body.status !== 200) {
                console.error('Failed to get token');
                return;
            }
            const response = await body.json();
    
            if (response.error) {
                console.error(response.error + ": " + response.error_description);
                return;
            }
            
            this.tokenData = {token: response as Token, lastRefresh: new Date()};
        }
    }

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
}

export default SpotifyEndpoint;
