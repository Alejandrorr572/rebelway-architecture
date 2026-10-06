import 'reflect-metadata'; 
import express from 'express';
import { AppDataSource } from './config/database'; 
import songRoutes from './song/song.route'

const app = express();
const PORT = process.env.PORT || 4002; 

// Middlewares
app.use(express.json()); 

// Rutas
app.use('/api/songs', songRoutes);

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
    });

export default app;