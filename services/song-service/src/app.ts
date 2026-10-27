import 'reflect-metadata'; 
import express, { Request, Response } from 'express';
import { AppDataSource } from './config/database';
import songRoutes from './song/song.route'

const app = express();
const PORT = process.env.PORT || 4002;

// Middlewares
app.use(express.json());

// Health check for the liveness and readiness probes
app.get('/health', (req: Request, res: Response) => {
    if (!AppDataSource.isInitialized) {
        return res.status(503).json({ message: "Database not initialized" });
    }

    return res.status(200).json({ status: "ok" });
});

// Rutas
app.use('/api/songs', songRoutes);

AppDataSource.initialize()
    .then(() => {
        console.log("Connection has been succesfully established");
        
        if (process.env.NODE_ENV !== 'test') {
            app.listen(PORT, () => {
                console.log(`Song service running in port: ${PORT}`);
            });
        }
    })
    .catch((error) => {
        console.error("Error when connecting to the db:", error);
        process.exit(1);
    });

export default app;