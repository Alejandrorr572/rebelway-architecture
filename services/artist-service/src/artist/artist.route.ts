import { Router, Request, Response } from "express";
import { ArtistService } from "./artist.service"; 

const router = Router();
const artistService = new ArtistService();

/**
 * @route POST /api/artists/spotify/:spotifyId
 * @desc Searchs an artists by spotify id, if it's already there it returns it, else it creates it using the spotify apo
 */
router.post('/spotify/:spotifyId', async (req: Request, res: Response) => {
    try {
        const { spotifyId } = req.params;

        if (!spotifyId) {
            return res.status(400).json({ message: "Spotify ID is obligatory" });
        }

        const artist = await artistService.getArtistFromSpotify(spotifyId);
        
        return res.status(200).json(artist);
    } catch (error) {
        console.error("Error while getting the Spotify Artist:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;