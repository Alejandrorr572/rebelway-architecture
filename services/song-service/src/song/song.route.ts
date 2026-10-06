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

export default router;