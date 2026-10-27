import {ISpotifyService, MockSpotifyService} from "../api/spotify.controller"
import { ArtistRepository } from "./artist.repository";

export class ArtistService {
    private spotifyService: ISpotifyService
    private artistRepository: ArtistRepository

        constructor() {
            this.spotifyService = new MockSpotifyService()
            this.artistRepository = new ArtistRepository()
        }

        //Loads an author to de DB from the spotify api
        async getArtistFromSpotify(spotifyId: string){

        // We need to check if the artist exists
        const existingArtist = await this.artistRepository.findOneBySpotifyId(spotifyId);

        // We return the existing one
        if (existingArtist) {
            return existingArtist
        }

        // Calling the spotify api
        const spotifyData = await this.spotifyService.getAuthorData(spotifyId);

        // We create the Artist and save it
        const newArtist = await this.artistRepository.create({
            name: spotifyData.name,
            spotifyId: spotifyData.spotifyId,
            spotifyUrl: spotifyData.spotifyUrl
        });

        await this.artistRepository.save(newArtist);

        return newArtist;

    }

        //Creates and saves an artist directly
        async createArtist(artistData: { name: string; spotifyId: string; spotifyUrl: string; }) {
            const newArtist = await this.artistRepository.create(artistData);

            return await this.artistRepository.save(newArtist);
        }

        //Gets an artist by Spotify ID
        async getArtistBySpotifyId(spotifyId: string) {
            return await this.artistRepository.findOneBySpotifyId(spotifyId);
        }
}