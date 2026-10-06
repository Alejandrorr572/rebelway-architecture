import { Song } from "../song/song.model";

export interface SpotifySongData {
  spotifyId: string;
  title: string;
  duration_ms: number;
  cover_url: string;
  preview_url: string;
  artistid: number;
}

export interface ISpotifyService {
  getSongData(spotifyId: string): Promise<SpotifySongData>; //Later will be changed for Spotify song.
}

//Mocked Service until the API is implemented in the next dev phase.
export class MockSpotifyService implements ISpotifyService { 
  async getSongData(spotifyId: string): Promise<SpotifySongData> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          spotifyId,
          title: "Mocked Song",
          duration_ms: 210000,
          cover_url: "http://mock.com/cover.jpg",
          preview_url: "http://mock.com/preview.mp3",
          artistid: 1
        });
      }, 500);
    });
  }
}

