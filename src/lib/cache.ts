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

import type { Playlist, PlaylistItem, Playlists } from "./api";

export class APICache {
    public playlists: Playlists | null = null;
    public playlistMap: Map<string, Playlist> = new Map();
    public playlistItems: Record<string, PlaylistItem[]> = {};
    public trackMap: Map<string, PlaylistItem> = new Map();
}

export class SpotifyAppCache {
    public selectedIDs: string[] = [];
    public songTable: SongTable = new Map();
}

export type SongTable = Map<string, Map<string, boolean>>;