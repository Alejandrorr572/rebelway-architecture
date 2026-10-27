import { Router, Request, Response } from "express";
import { SongService } from "./song.service";

const router = Router();
const songService = new SongService();

/**
 * @route POST /api/songs/spotify/:spotifyId
 * @desc Searches a song by spotify id, if it's already there it returns it, else it creates it using the spotify api
 */
router.post('/spotify/:spotifyId', async (req: Request, res: Response) => {
    try {
        const { spotifyId } = req.params;

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

        if (!title || !spotifyId || !duration_ms || !cover_url || !artistid) {
            return res.status(400).json({ message: "Missing mandatory fields" });
        }

        const savedSong = await songService.createSong({
            title,
            spotifyId,
            duration_ms,
            cover_url,
            preview_url,
            artistid
        });

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
        const song = await songService.getSongBySpotifyId(spotifyId);

        if (!song) {
            return res.status(404).json({ message: "Song not found" });
        }

        return res.status(200).json(song);
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;