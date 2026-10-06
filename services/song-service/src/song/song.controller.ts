import { Song } from "./song.model";
import { AppDataSource } from "../config/database";

export class SongController {
    async create(songData: { title: string; duration_ms: number; cover_url: string; preview_url: string; artistid: number; spotifyId: string; }) {
        const newSong = AppDataSource
            .getRepository(Song)
            .create(songData);
            
        return newSong;
    }

    async save(newSong: Song) {
        const savedSong = await AppDataSource
            .getRepository(Song)
            .save(newSong);
            
        return savedSong;
    }

    async findOneBySpotifyId(spotifyId: string) {
        return await AppDataSource
            .getRepository(Song)
            .findOneBy({ spotifyId: spotifyId }); 
    }
}

