import { SongService } from './song.service';
import { MockSpotifyService } from '../api/spotify.controller';
import { AppDataSource } from '../config/database';

// Fully mock the external Spotify API dependency
jest.mock('../api/spotify.controller');

// Fully mock the TypeORM repository and database configuration
jest.mock('../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('SongService', () => {
  let songService: SongService;
  let mockSpotifyServiceInstance: any;
  let mockRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOneBy: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);

    mockSpotifyServiceInstance = {
      getSongData: jest.fn(),
    };
    (MockSpotifyService as jest.Mock).mockImplementation(() => mockSpotifyServiceInstance);

    songService = new SongService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('createSong: Should successfully create and return the song when the Spotify API returns valid data', async () => {
    const validSpotifyId = 'valid-id-123';
    const mockSpotifyData = {
      spotifyId: validSpotifyId,
      title: 'Valid Song',
      duration_ms: 180000,
      cover_url: 'http://spotify.com/cover',
      preview_url: 'http://spotify.com/preview',
      artistid: 1
    };
    const mockCreatedSong = { ...mockSpotifyData, id: 1 };

    mockRepository.findOneBy.mockResolvedValue(null);
    mockSpotifyServiceInstance.getSongData.mockResolvedValue(mockSpotifyData);
    mockRepository.create.mockReturnValue(mockCreatedSong);
    mockRepository.save.mockResolvedValue(mockCreatedSong);

    const result = await songService.getSongFromSpotify(validSpotifyId);

    expect(mockRepository.findOneBy).toHaveBeenCalledWith({ spotifyId: validSpotifyId });
    expect(mockSpotifyServiceInstance.getSongData).toHaveBeenCalledWith(validSpotifyId);
    expect(mockRepository.create).toHaveBeenCalledWith({
      title: mockSpotifyData.title,
      spotifyId: mockSpotifyData.spotifyId,
      duration_ms: mockSpotifyData.duration_ms,
      cover_url: mockSpotifyData.cover_url,
      preview_url: mockSpotifyData.preview_url,
      artistid: mockSpotifyData.artistid
    });
    expect(mockRepository.save).toHaveBeenCalledWith(mockCreatedSong);
    expect(result).toEqual(mockCreatedSong);
  });

  it('createSong: Should throw a validation error when the Spotify API returns data missing a mandatory (non-nullable) field', async () => {
    const validSpotifyId = 'missing-field-id';
    const invalidSpotifyData = {
      spotifyId: validSpotifyId,
      // Missing 'title' which is mandatory
    };

    mockRepository.findOneBy.mockResolvedValue(null);
    mockSpotifyServiceInstance.getSongData.mockResolvedValue(invalidSpotifyData);
    mockRepository.create.mockReturnValue(invalidSpotifyData);
    
    const validationError = new Error('Validation failed: title is required');
    mockRepository.save.mockRejectedValue(validationError);

    await expect(songService.getSongFromSpotify(validSpotifyId)).rejects.toThrow(validationError);

    expect(mockRepository.create).toHaveBeenCalled();
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('findBySpotifyId: Should return the song object when the TypeORM repository finds the record', async () => {
    const existingSpotifyId = 'existing-id-456';
    const existingSong = {
      id: 2,
      title: 'Existing Song',
      spotifyId: existingSpotifyId,
    };

    mockRepository.findOneBy.mockResolvedValue(existingSong);

    const result = await songService.getSongFromSpotify(existingSpotifyId);

    expect(mockRepository.findOneBy).toHaveBeenCalledWith({ spotifyId: existingSpotifyId });
    expect(mockSpotifyServiceInstance.getSongData).not.toHaveBeenCalled();
    expect(result).toEqual(existingSong);
  });

  it('findBySpotifyId: Should handle the "not found" scenario correctly (returning null or throwing an error) when the repository returns nothing', async () => {
    const notFoundSpotifyId = 'not-found-789';

    mockRepository.findOneBy.mockResolvedValue(null);

    const apiError = new Error('Song not found on Spotify');
    mockSpotifyServiceInstance.getSongData.mockRejectedValue(apiError);

    await expect(songService.getSongFromSpotify(notFoundSpotifyId)).rejects.toThrow(apiError);

    expect(mockRepository.findOneBy).toHaveBeenCalledWith({ spotifyId: notFoundSpotifyId });
    expect(mockSpotifyServiceInstance.getSongData).toHaveBeenCalledWith(notFoundSpotifyId);
  });

  it('createSong: Should create and save the song directly, returning the saved entity', async () => {
    const songData = {
      title: 'Direct Song',
      spotifyId: 'direct-song-id',
      duration_ms: 150000,
      cover_url: 'http://spotify.com/direct-cover',
      preview_url: 'http://spotify.com/direct-preview',
      artistid: 1
    };
    const mockCreatedSong = { ...songData };
    const mockSavedSong = { ...songData, id: 3 };

    mockRepository.create.mockReturnValue(mockCreatedSong);
    mockRepository.save.mockResolvedValue(mockSavedSong);

    const result = await songService.createSong(songData);

    expect(mockRepository.create).toHaveBeenCalledWith(songData);
    expect(mockRepository.save).toHaveBeenCalledWith(mockCreatedSong);
    // Should NOT touch the Spotify API
    expect(mockSpotifyServiceInstance.getSongData).not.toHaveBeenCalled();
    expect(result).toEqual(mockSavedSong);
  });

  it('getSongBySpotifyId: Should return the song found by the repository', async () => {
    const existingSong = {
      id: 4,
      title: 'Found Song',
      spotifyId: 'found-song-id',
    };

    mockRepository.findOneBy.mockResolvedValue(existingSong);

    const result = await songService.getSongBySpotifyId('found-song-id');

    expect(mockRepository.findOneBy).toHaveBeenCalledWith({ spotifyId: 'found-song-id' });
    expect(mockSpotifyServiceInstance.getSongData).not.toHaveBeenCalled();
    expect(result).toEqual(existingSong);
  });

  it('getSongBySpotifyId: Should return null when the repository finds nothing, without calling the Spotify API', async () => {
    mockRepository.findOneBy.mockResolvedValue(null);

    const result = await songService.getSongBySpotifyId('missing-song-id');

    expect(mockRepository.findOneBy).toHaveBeenCalledWith({ spotifyId: 'missing-song-id' });
    expect(mockSpotifyServiceInstance.getSongData).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});

