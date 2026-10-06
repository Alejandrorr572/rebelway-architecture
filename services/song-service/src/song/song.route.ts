import { Router, Request, Response } from "express";
import { SongService } from "./song.service"; 
import { SongController } from "./song.controller";

const router = Router();
const songService = new SongService();
const songController = new SongController();

/**
 * @route POST /api/songs/spotify/:spotifyId
 * @desc Searches a song by spotify id, if it's already there it returns it, else it creates it using the spotify api
 */
router.post('/spotify/:spotifyId', async (req: Request, res: Response) => {
    try {
        const { spotifyId } = req.params;

        if (!spotifyId) {
            return res.status(400).json({ message: "Spotify ID is obligatory" });
        }

        const song = await songService.getSongFromSpotify(spotifyId);
        
        return res.status(200).json(song);
    } catch (error) {
        console.error("Error while getting the Spotify Song:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

/**
 * @route POST /api/songs
 * @desc Creates a new song directly
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const { title, spotifyId, duration_ms, cover_url, preview_url, artistid } = req.body;

        if (!title || !spotifyId) {
            return res.status(400).json({ message: "Missing mandatory fields" });
        }

        const newSong = await songController.create({ 
            title, 
            spotifyId, 
            duration_ms: duration_ms || 0,
            cover_url: cover_url || '',
            preview_url,
            artistid: artistid || 0
        });
        
        const savedSong = await songController.save(newSong);
        return res.status(201).json(savedSong);
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

/**
 * @route GET /api/songs/:spotifyId
 * @desc Gets a song by Spotify ID
 */
router.get('/:spotifyId', async (req: Request, res: Response) => {
    try {
        const { spotifyId } = req.params;
        const song = await songController.findOneBySpotifyId(spotifyId);

        if (!song) {
            return res.status(404).json({ message: "Song not found" });
        }

        return res.status(200).json(song);
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;