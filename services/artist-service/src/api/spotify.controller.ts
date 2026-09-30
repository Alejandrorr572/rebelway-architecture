import { Artist } from "../artist/artist.model";

export interface SpotifyArtistData {
  spotifyId: string;
  name: string;
  spotifyUrl: string;
}

export interface ISpotifyService {
  getAuthorData(spotifyId: string): Promise<SpotifyArtistData>; //Later will be changed for Spotify artist.
}

//Mocked Service until the API is implemented in the next dev phase.
export class MockSpotifyService implements ISpotifyService { 
  async getAuthorData(spotifyId: string): Promise<SpotifyArtistData> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          spotifyId,
          name: "Mock",
          spotifyUrl: ""
        });
      }, 500);
    });
  }
}