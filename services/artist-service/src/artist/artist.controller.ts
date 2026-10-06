import { Artist } from "./artist.model";
import { AppDataSource } from "../config/database";

export class ArtistController {
    async create(artistData: { name: string; spotifyId: string; spotifyUrl: string; }) {
        const newArtist = AppDataSource
            .getRepository(Artist)
            .create(artistData);
            
        return newArtist;
    }

    async save(newArtist: Artist) {
        const savedArtist = await AppDataSource
            .getRepository(Artist)
            .save(newArtist);
            
        return savedArtist;
    }

    async findOneBySpotifyId(spotifyId: string) {
    return await AppDataSource
        .getRepository(Artist)
        .findOneBy({ spotifyId: spotifyId }); 
    }

}