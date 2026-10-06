import { Router, Request, Response } from "express";
import { ArtistService } from "./artist.service"; 
import { ArtistController } from "./artist.controller";

const router = Router();
const artistService = new ArtistService();
const artistController = new ArtistController();

/**
 * @route POST /api/artists/spotify/:spotifyId
 * @desc Searchs an artists by spotify id, if it's already there it returns it, else it creates it using the spotify api
 */
router.post('/spotify/:spotifyId', async (req: Request, res: Response) => {
    try {
        const { spotifyId } = req.params;

        const artist = await artistService.getArtistFromSpotify(spotifyId);
        
        return res.status(200).json(artist);
    } catch (error) {
        console.error("Error while getting the Spotify Artist:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

/**
 * @route POST /api/artists
 * @desc Creates a new artist directly
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, spotifyId, spotifyUrl } = req.body;

        if (!name || !spotifyId) {
            return res.status(400).json({ message: "Missing mandatory fields" });
        }

        const newArtist = await artistController.create({ 
            name, 
            spotifyId, 
            spotifyUrl 
        });
        
        const savedArtist = await artistController.save(newArtist);
        return res.status(201).json(savedArtist);
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

/**
 * @route GET /api/artists/:spotifyId
 * @desc Gets an artist by Spotify ID
 */
router.get('/:spotifyId', async (req: Request, res: Response) => {
    try {
        const { spotifyId } = req.params;
        const artist = await artistController.findOneBySpotifyId(spotifyId);

        if (!artist) {
            return res.status(404).json({ message: "Artist not found" });
        }

        return res.status(200).json(artist);
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;