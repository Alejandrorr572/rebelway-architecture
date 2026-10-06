import { AppDataSource } from '../config/database';
import { SongService } from './song.service';
import { MockSpotifyService } from '../api/spotify.controller';
import { Song } from './song.model';
import { QueryFailedError } from 'typeorm';

// Completely mock the external Spotify API dependency
jest.mock('../api/spotify.controller');

// Mock the database configuration to use an in-memory SQLite database
jest.mock('../config/database', () => {
  const { DataSource } = require('typeorm');
  const { Song } = require('./song.model');
  
  return {
    AppDataSource: new DataSource({
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      dropSchema: true,
      entities: [Song],
    })
  };
});

describe('SongService Integration (SQLite In-Memory)', () => {
  let songService: SongService;
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
      getSongData: jest.fn(),
    };
    (MockSpotifyService as jest.Mock).mockImplementation(() => mockSpotifyServiceInstance);
    
    // Instantiate the actual SongService
    songService = new SongService();
  });

  afterEach(async () => {
    // Clear the song table to ensure complete isolation between tests
    await AppDataSource.getRepository(Song).clear();
    jest.clearAllMocks();
  });

  it('saveSong: Should successfully persist a new song in the database and auto-generate the primary key (id)', async () => {
    const spotifyId = 'unique-song-123';
    
    mockSpotifyServiceInstance.getSongData.mockResolvedValue({
      spotifyId,
      title: 'Integration Song',
      duration_ms: 100,
      cover_url: 'http://cov.er',
      preview_url: 'http://pre.view',
      artistid: 1
    });

    const result = await songService.getSongFromSpotify(spotifyId);

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    
    const dbSong = await AppDataSource.getRepository(Song).findOneBy({ id: result.id });
    expect(dbSong).not.toBeNull();
    expect(dbSong!.id).toEqual(result.id);
  });

  it('uniqueConstraint: Should throw a TypeORM QueryFailedError when attempting to save a second song with a spotifyId that already exists in the database', async () => {
    const repository = AppDataSource.getRepository(Song);
    
    const song1 = repository.create({
      title: 'Song 1',
      spotifyId: 'duplicate-song-id',
      duration_ms: 100,
      cover_url: 'http',
      artistid: 1
    });
    
    const song2 = repository.create({
      title: 'Song 2',
      spotifyId: 'duplicate-song-id', // Same spotifyId
      duration_ms: 200,
      cover_url: 'http',
      artistid: 1
    });

    await repository.save(song1);

    await expect(repository.save(song2)).rejects.toThrow(QueryFailedError);
  });

  it('nullableConstraint: Should successfully save a song with a null preview_url, verifying that the nullable configuration works at the database level', async () => {
    const repository = AppDataSource.getRepository(Song);
    
    const song = repository.create({
      title: 'No Preview Song',
      spotifyId: 'no-preview-id',
      duration_ms: 100,
      cover_url: 'http',
      artistid: 1,
      preview_url: null as any, // explicitly null
    });

    const savedSong = await repository.save(song);
    
    expect(savedSong.id).toBeDefined();
    
    const dbSong = await repository.findOneBy({ id: savedSong.id });
    expect(dbSong).not.toBeNull();
    expect(dbSong!.preview_url).toBeNull();
  });
});

