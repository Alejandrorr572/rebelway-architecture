import { ArtistService } from './artist.service';
import { MockSpotifyService } from '../api/spotify.controller';
import { AppDataSource } from '../config/database';
import { Artist } from './artist.model';

// Fully mock the external Spotify API dependency
jest.mock('../api/spotify.controller');

// Fully mock the TypeORM repository and database configuration
jest.mock('../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('ArtistService', () => {
  let artistService: ArtistService;
  let mockSpotifyServiceInstance: any;
  let mockRepository: any;

  beforeEach(() => {
    // Clear and reset mocks before each test (can also be done in afterEach)
    jest.clearAllMocks();

    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOneBy: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);

    // Provide mocked implementation of Spotify Service
    mockSpotifyServiceInstance = {
      getAuthorData: jest.fn(),
    };
    (MockSpotifyService as jest.Mock).mockImplementation(() => mockSpotifyServiceInstance);

    // Initialize service with mocked dependencies
    artistService = new ArtistService();
  });

  afterEach(() => {
    // Clear and reset mocks after each test
    jest.clearAllMocks();
  });

  it('createArtist: Should successfully create and return the artist when the Spotify API returns valid data', async () => {
    const validSpotifyId = 'valid-id-123';
    const mockSpotifyData = {
      spotifyId: validSpotifyId,
      name: 'Valid Artist',
      spotifyUrl: 'http://spotify.com/valid',
    };
    const mockCreatedArtist = { ...mockSpotifyData, id: 1 };

    // Repository finds nothing (artist does not exist)
    mockRepository.findOneBy.mockResolvedValue(null);
    // Spotify API returns valid data
    mockSpotifyServiceInstance.getAuthorData.mockResolvedValue(mockSpotifyData);
    // Repository successfully creates and saves
    mockRepository.create.mockReturnValue(mockCreatedArtist);
    mockRepository.save.mockResolvedValue(mockCreatedArtist);

    const result = await artistService.getArtistFromSpotify(validSpotifyId);

    expect(mockRepository.findOneBy).toHaveBeenCalledWith({ spotifyId: validSpotifyId });
    expect(mockSpotifyServiceInstance.getAuthorData).toHaveBeenCalledWith(validSpotifyId);
    expect(mockRepository.create).toHaveBeenCalledWith({
      name: mockSpotifyData.name,
      spotifyId: mockSpotifyData.spotifyId,
      spotifyUrl: mockSpotifyData.spotifyUrl,
    });
    expect(mockRepository.save).toHaveBeenCalledWith(mockCreatedArtist);
    expect(result).toEqual(mockCreatedArtist);
  });

  it('createArtist: Should throw a validation error when the Spotify API returns data missing a mandatory (non-nullable) field', async () => {
    const validSpotifyId = 'missing-field-id';
    const invalidSpotifyData = {
      spotifyId: validSpotifyId,
      // Missing 'name' which is mandatory
      spotifyUrl: 'http://spotify.com/invalid',
    };

    mockRepository.findOneBy.mockResolvedValue(null);
    mockSpotifyServiceInstance.getAuthorData.mockResolvedValue(invalidSpotifyData);
    mockRepository.create.mockReturnValue(invalidSpotifyData);
    
    // TypeORM mock simulates throwing a validation error on save
    const validationError = new Error('Validation failed: name is required');
    mockRepository.save.mockRejectedValue(validationError);

    await expect(artistService.getArtistFromSpotify(validSpotifyId)).rejects.toThrow(validationError);

    expect(mockRepository.create).toHaveBeenCalled();
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('findBySpotifyId: Should return the artist object when the TypeORM repository finds the record', async () => {
    const existingSpotifyId = 'existing-id-456';
    const existingArtist = {
      id: 2,
      name: 'Existing Artist',
      spotifyId: existingSpotifyId,
      spotifyUrl: 'http://spotify.com/existing',
    };

    // Repository finds the record
    mockRepository.findOneBy.mockResolvedValue(existingArtist);

    const result = await artistService.getArtistFromSpotify(existingSpotifyId);

    // Should return early and NOT call the Spotify API
    expect(mockRepository.findOneBy).toHaveBeenCalledWith({ spotifyId: existingSpotifyId });
    expect(mockSpotifyServiceInstance.getAuthorData).not.toHaveBeenCalled();
    expect(mockRepository.create).not.toHaveBeenCalled();
    expect(mockRepository.save).not.toHaveBeenCalled();
    
    expect(result).toEqual(existingArtist);
  });

  it('findBySpotifyId: Should handle the "not found" scenario correctly (returning null or throwing an error) when the repository returns nothing', async () => {
    const notFoundSpotifyId = 'not-found-789';

    // Repository returns nothing
    mockRepository.findOneBy.mockResolvedValue(null);

    // To isolate just the "not found" scenario in findBySpotifyId as requested,
    // we can assume the Spotify API also fails to find it, throwing an error,
    // or we just assert that when findOneBy is null, it attempts to fetch from Spotify.
    const apiError = new Error('Artist not found on Spotify');
    mockSpotifyServiceInstance.getAuthorData.mockRejectedValue(apiError);

    await expect(artistService.getArtistFromSpotify(notFoundSpotifyId)).rejects.toThrow(apiError);

    expect(mockRepository.findOneBy).toHaveBeenCalledWith({ spotifyId: notFoundSpotifyId });
    // Ensures we attempted to fall back to the Spotify API when not found in DB
    expect(mockSpotifyServiceInstance.getAuthorData).toHaveBeenCalledWith(notFoundSpotifyId);
  });
});

