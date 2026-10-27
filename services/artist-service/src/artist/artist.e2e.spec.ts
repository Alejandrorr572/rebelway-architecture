import request from 'supertest';
import { DataSource } from 'typeorm';
import { Artist } from './artist.model';

// 1. Create a real TypeORM DataSource configured for in-memory SQLite
const testDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  synchronize: true,
  dropSchema: true,
  entities: [Artist],
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
        getAuthorData: jest.fn().mockResolvedValue({
          spotifyId: 'mock-spotify-id',
          name: 'Mocked E2E Artist',
          spotifyUrl: 'http://mock.url',
        }),
      };
    }),
  };
});

// Import the app AFTER mocking dependencies
import app from '../app';

describe('Artist API E2E (SQLite In-Memory)', () => {
  beforeAll(async () => {
    // Set NODE_ENV to test to prevent app.listen() from running in app.ts
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
    // Clear the artist table to ensure test isolation
    await testDataSource.getRepository(Artist).clear();
    jest.clearAllMocks();
  });

  it('POST /api/artists: Should return 201 Created and the artist JSON data when a valid payload is provided', async () => {
    const payload = {
      name: 'E2E Test Artist',
      spotifyId: 'e2e-id-1',
      spotifyUrl: 'http://spotify.com/e2e-1',
    };

    const response = await request(app)
      .post('/api/artists')
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(payload.name);
    expect(response.body.spotifyId).toBe(payload.spotifyId);
    
    // Verify it exists in the database
    const dbRecord = await testDataSource.getRepository(Artist).findOneBy({ spotifyId: payload.spotifyId });
    expect(dbRecord).not.toBeNull();
  });

  it('POST /api/artists: Should return 400 Bad Request (or appropriate error code) when the payload is missing mandatory fields', async () => {
    // Missing 'name' and 'spotifyId' which our route defines as mandatory
    const invalidPayload = {
      spotifyUrl: 'http://spotify.com/invalid',
    };

    const response = await request(app)
      .post('/api/artists')
      .send(invalidPayload);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Missing mandatory fields');
  });

  it('GET /api/artists/:spotifyId: Should return 200 OK and the artist JSON data when the artist exists in the in-memory database', async () => {
    // Pre-insert an artist into the database
    const existingSpotifyId = 'e2e-existing-id';
    const newArtist = testDataSource.getRepository(Artist).create({
      name: 'Pre-existing Artist',
      spotifyId: existingSpotifyId,
      spotifyUrl: 'http://existing.url',
    });
    const savedArtist = await testDataSource.getRepository(Artist).save(newArtist);

    const response = await request(app).get(`/api/artists/${existingSpotifyId}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', savedArtist.id);
    expect(response.body.name).toBe(savedArtist.name);
    expect(response.body.spotifyId).toBe(existingSpotifyId);
  });

  it('GET /api/artists/:spotifyId: Should return 404 Not Found when the artist does not exist', async () => {
    const nonExistentId = 'does-not-exist';

    const response = await request(app).get(`/api/artists/${nonExistentId}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message', 'Artist not found');
  });

  // Tests for the /spotify proxy route to boost coverage
  it('POST /api/artists/spotify/:spotifyId: Should fetch from mock API and save', async () => {
    const mockSpotifyId = 'mock-spotify-id';
    const response = await request(app).post(`/api/artists/spotify/${mockSpotifyId}`);
    
    expect(response.status).toBe(200);
    expect(response.body.spotifyId).toBe(mockSpotifyId);
  });

  it('GET /health: Should return 200 OK and status ok when the database is initialized', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('GET /health: Should return 503 Service Unavailable when the database is not initialized', async () => {
    (testDataSource as any).isInitialized = false;

    try {
      const response = await request(app).get('/health');

      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty('message', 'Database not initialized');
    } finally {
      (testDataSource as any).isInitialized = true;
    }
  });
});

describe('Artist service startup', () => {
  it('Should exit the process with code 1 when the database connection fails', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const connectionError = new Error('Connection refused');

    // Load a fresh copy of app.ts whose database initialization fails
    // (resetModules drops the cached database mock used by the API tests above)
    jest.resetModules();
    jest.doMock('../config/database', () => ({
      AppDataSource: { initialize: jest.fn().mockRejectedValue(connectionError) },
    }));
    require('../app');

    // Let the rejected initialize() promise settle
    await new Promise(setImmediate);

    expect(errorSpy).toHaveBeenCalledWith('Error when connecting to the db:', connectionError);
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
