import request from 'supertest';
import { DataSource } from 'typeorm';
import { Song } from './song.model';

// 1. Create a real TypeORM DataSource configured for in-memory SQLite
const testDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  synchronize: true,
  dropSchema: true,
  entities: [Song],
});

// Hijack initialize so app.ts doesn't trigger it asynchronously in the background
const actualInitialize = testDataSource.initialize.bind(testDataSource);
testDataSource.initialize = async () => {
  return testDataSource;
};

// 2. Mock the database config so app.ts uses our testDataSource
jest.mock('../config/database', () => {
  return {
    AppDataSource: testDataSource,
  };
});

// 3. Fully mock the external SpotifyService to avoid real API calls
jest.mock('../api/spotify.controller', () => {
  return {
    MockSpotifyService: jest.fn().mockImplementation(() => {
      return {
        getSongData: jest.fn().mockResolvedValue({
          spotifyId: 'mock-spotify-song-id',
          title: 'Mocked E2E Song',
          duration_ms: 100,
          cover_url: 'http://cov.er',
          preview_url: 'http://pre.view',
          artistid: 1
        }),
      };
    }),
  };
});

// Import the app AFTER mocking dependencies
import app from '../app';

describe('Song API E2E (SQLite In-Memory)', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    // We explicitly initialize the database here to avoid race conditions with app.ts
    await actualInitialize();
  });

  afterAll(async () => {
    // Destroy the database connection
    if (testDataSource.isInitialized) {
      await testDataSource.destroy();
    }
  });

  afterEach(async () => {
    // Clear the song table to ensure test isolation
    await testDataSource.getRepository(Song).clear();
    jest.clearAllMocks();
  });

  it('POST /api/songs: Should return 201 Created and the song JSON data when a valid payload is provided', async () => {
    const payload = {
      title: 'E2E Test Song',
      spotifyId: 'e2e-song-id-1',
      duration_ms: 200,
      cover_url: 'http://cover.com',
      preview_url: 'http://preview.com',
      artistid: 1
    };

    const response = await request(app)
      .post('/api/songs')
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe(payload.title);
    expect(response.body.spotifyId).toBe(payload.spotifyId);
    
    // Verify it exists in the database
    const dbRecord = await testDataSource.getRepository(Song).findOneBy({ spotifyId: payload.spotifyId });
    expect(dbRecord).not.toBeNull();
  });

  it('POST /api/songs: Should return 400 Bad Request (or appropriate error code) when the payload is missing mandatory fields', async () => {
    const invalidPayload = {
      // Missing 'title' and 'spotifyId' which our route defines as mandatory
      duration_ms: 200,
    };

    const response = await request(app)
      .post('/api/songs')
      .send(invalidPayload);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Missing mandatory fields');
  });

  it('GET /api/songs/:spotifyId: Should return 200 OK and the song JSON data when the song exists in the in-memory database', async () => {
    const existingSpotifyId = 'e2e-existing-song-id';
    const newSong = testDataSource.getRepository(Song).create({
      title: 'Pre-existing Song',
      spotifyId: existingSpotifyId,
      duration_ms: 100,
      cover_url: 'http',
      artistid: 1
    });
    const savedSong = await testDataSource.getRepository(Song).save(newSong);

    const response = await request(app).get(`/api/songs/${existingSpotifyId}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', savedSong.id);
    expect(response.body.title).toBe(savedSong.title);
    expect(response.body.spotifyId).toBe(existingSpotifyId);
  });

  it('GET /api/songs/:spotifyId: Should return 404 Not Found when the song does not exist', async () => {
    const nonExistentId = 'does-not-exist';

    const response = await request(app).get(`/api/songs/${nonExistentId}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message', 'Song not found');
  });

  // Tests for the /spotify proxy route to boost coverage
  it('POST /api/songs/spotify/:spotifyId: Should fetch from mock API and save', async () => {
    const mockSpotifyId = 'mock-spotify-song-id';
    const response = await request(app).post(`/api/songs/spotify/${mockSpotifyId}`);
    
    expect(response.status).toBe(200);
    expect(response.body.spotifyId).toBe(mockSpotifyId);
  });
});
