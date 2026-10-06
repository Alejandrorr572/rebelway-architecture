import {ISpotifyService, MockSpotifyService} from "../api/spotify.controller"
import { ArtistController } from "./artist.controller";

export class ArtistService {
    private spotifyService: ISpotifyService
    private artistController: ArtistController

        constructor() {
            this.spotifyService = new MockSpotifyService()
            this.artistController = new ArtistController()
        }

        //Loads an author to de DB from the spotify api
        async getArtistFromSpotify(spotifyId: string){

        // We need to check if the artist exists
        const existingArtist = await this.artistController.findOneBySpotifyId(spotifyId);

        // We return the existing one
        if (existingArtist) {
            return existingArtist
        }

        // Calling the spotify api
        const spotifyData = await this.spotifyService.getAuthorData(spotifyId);

        // We create the Artist and save it
        const newArtist = await this.artistController.create({
            name: spotifyData.name,
            spotifyId: spotifyData.spotifyId,
            spotifyUrl: spotifyData.spotifyUrl
        });

        await this.artistController.save(newArtist);

        return newArtist;
    
    }
}