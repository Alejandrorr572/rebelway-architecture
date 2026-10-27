import 'reflect-metadata'; 
import express, { Request, Response } from 'express';
import { AppDataSource } from './config/database';
import artistRoutes from './artist/artist.route';

const app = express();
const PORT = process.env.PORT || 4001;

// Middlewares
app.use(express.json());

// Health check for the liveness and readiness probes
app.get('/health', (req: Request, res: Response) => {
    if (!AppDataSource.isInitialized) {
        return res.status(503).json({ message: "Database not initialized" });
    }

    return res.status(200).json({ status: "ok" });
});

// Routes
app.use('/api/artists', artistRoutes);

AppDataSource.initialize()
    .then(() => {
        console.log("Connection has been succesfully established");
        
        if (process.env.NODE_ENV !== 'test') {
            app.listen(PORT, () => {
                console.log(`Artist service running in port: ${PORT}`);
            });
        }
    })
    .catch((error) => {
        console.error("Error when connecting to the db:", error);
        process.exit(1);
    });

export default app;