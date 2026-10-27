import { ISpotifyService, MockSpotifyService } from "../api/spotify.controller"
import { SongRepository } from "./song.repository";

export class SongService {
    private spotifyService: ISpotifyService
    private songRepository: SongRepository

    constructor() {
        this.spotifyService = new MockSpotifyService()
        this.songRepository = new SongRepository()
    }

    //Loads a song to the DB from the spotify api
    async getSongFromSpotify(spotifyId: string){

        // We need to check if the song exists
        const existingSong = await this.songRepository.findOneBySpotifyId(spotifyId);

        // We return the existing one
        if (existingSong) {
            return existingSong
        }

        // Calling the spotify api
        const spotifyData = await this.spotifyService.getSongData(spotifyId);

        // We create the Song and save it
        const newSong = await this.songRepository.create({
            title: spotifyData.title,
            duration_ms: spotifyData.duration_ms,
            cover_url: spotifyData.cover_url,
            preview_url: spotifyData.preview_url,
            artistid: spotifyData.artistid,
            spotifyId: spotifyData.spotifyId
        });

        await this.songRepository.save(newSong);

        return newSong;
    }

    //Creates and saves a song directly
    async createSong(songData: { title: string; duration_ms: number; cover_url: string; preview_url: string; artistid: number; spotifyId: string; }) {
        const newSong = await this.songRepository.create(songData);

        return await this.songRepository.save(newSong);
    }

    //Gets a song by Spotify ID
    async getSongBySpotifyId(spotifyId: string) {
        return await this.songRepository.findOneBySpotifyId(spotifyId);
    }
}

