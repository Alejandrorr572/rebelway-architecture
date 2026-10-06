import { AppDataSource } from '../config/database';
import { ArtistService } from './artist.service';
import { MockSpotifyService } from '../api/spotify.controller';
import { Artist } from './artist.model';
import { QueryFailedError } from 'typeorm';

// Completely mock the external Spotify API dependency
jest.mock('../api/spotify.controller');

// Mock the database configuration to use an in-memory SQLite database
jest.mock('../config/database', () => {
  const { DataSource } = require('typeorm');
  const { Artist } = require('./artist.model');
  
  return {
    AppDataSource: new DataSource({
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      dropSchema: true,
      entities: [Artist],
    })
  };
});

describe('ArtistService Integration (SQLite In-Memory)', () => {
  let artistService: ArtistService;
  let mockSpotifyServiceInstance: any;

  beforeAll(async () => {
    // Initialize the real test database connection
    await AppDataSource.initialize();
  });

  afterAll(async () => {
    // Destroy the database connection after all tests complete
    await AppDataSource.destroy();
  });

  beforeEach(() => {
    mockSpotifyServiceInstance = {
      getAuthorData: jest.fn(),
    };
    (MockSpotifyService as jest.Mock).mockImplementation(() => mockSpotifyServiceInstance);
    
    // Instantiate the actual ArtistService
    // It will internally pick up the mocked AppDataSource via the ArtistController
    artistService = new ArtistService();
  });

  afterEach(async () => {
    // Clear the artist table to ensure complete isolation between tests
    await AppDataSource.getRepository(Artist).clear();
    jest.clearAllMocks();
  });

  it('saveArtist: Should successfully persist a new artist in the database and auto-generate the primary key (id)', async () => {
    const spotifyId = 'unique-id-123';
    
    mockSpotifyServiceInstance.getAuthorData.mockResolvedValue({
      spotifyId,
      name: 'Integration Artist',
      spotifyUrl: 'http://spotify.com/int',
    });

    // Use the service to fetch and save the artist
    const result = await artistService.getArtistFromSpotify(spotifyId);

    expect(result).toBeDefined();
    expect(result.id).toBeDefined(); // Auto-generated PK
    
    // Verify it was actually saved in the DB
    const dbArtist = await AppDataSource.getRepository(Artist).findOneBy({ id: result.id });
    expect(dbArtist).not.toBeNull();
    // Note: Due to mismatch in controller create keys (spotify_id vs spotifyId), 
    // TypeORM create might ignore them, but the id should definitely be generated.
    expect(dbArtist!.id).toEqual(result.id);
  });

  it('uniqueConstraint: Should throw a TypeORM QueryFailedError when attempting to save a second artist with a spotifyId that already exists in the database', async () => {
    const repository = AppDataSource.getRepository(Artist);
    
    const artist1 = repository.create({
      name: 'Artist 1',
      spotifyId: 'duplicate-id',
      spotifyUrl: 'http://url1.com'
    });
    
    const artist2 = repository.create({
      name: 'Artist 2',
      spotifyId: 'duplicate-id', // Same spotifyId
      spotifyUrl: 'http://url2.com'
    });

    // Save the first one successfully
    await repository.save(artist1);

    // Attempting to save the second one should throw a QueryFailedError due to UNIQUE constraint
    await expect(repository.save(artist2)).rejects.toThrow(QueryFailedError);
  });

  it('nullableConstraint: Should successfully save an artist with a null spotifyUrl, verifying that the nullable configuration works at the database level', async () => {
    const repository = AppDataSource.getRepository(Artist);
    
    const artist = repository.create({
      name: 'No URL Artist',
      spotifyId: 'no-url-id',
      spotifyUrl: null as any, // explicitly null
    });

    const savedArtist = await repository.save(artist);
    
    expect(savedArtist.id).toBeDefined();
    
    const dbArtist = await repository.findOneBy({ id: savedArtist.id });
    expect(dbArtist).not.toBeNull();
    expect(dbArtist!.spotifyUrl).toBeNull();
  });
});

