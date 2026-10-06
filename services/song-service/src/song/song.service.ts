import { ISpotifyService, MockSpotifyService } from "../api/spotify.controller"
import { SongController } from "./song.controller";

export class SongService {
    private spotifyService: ISpotifyService
    private songController: SongController

    constructor() {
        this.spotifyService = new MockSpotifyService()
        this.songController = new SongController()
    }

    //Loads a song to the DB from the spotify api
    async getSongFromSpotify(spotifyId: string){

        // We need to check if the song exists
        const existingSong = await this.songController.findOneBySpotifyId(spotifyId);

        // We return the existing one
        if (existingSong) {
            return existingSong
        }

        // Calling the spotify api
        const spotifyData = await this.spotifyService.getSongData(spotifyId);

        // We create the Song and save it
        const newSong = await this.songController.create({
            title: spotifyData.title,
            duration_ms: spotifyData.duration_ms,
            cover_url: spotifyData.cover_url,
            preview_url: spotifyData.preview_url,
            artistid: spotifyData.artistid,
            spotifyId: spotifyData.spotifyId
        });

        await this.songController.save(newSong);

        return newSong;
    }
}

