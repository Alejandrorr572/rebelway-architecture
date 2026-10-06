import 'reflect-metadata'; 
import express from 'express';
import { AppDataSource } from './config/database'; 
import artistRoutes from './artist/artist.route'; 

const app = express();
const PORT = process.env.PORT || 4001; 

// Middlewares
app.use(express.json()); 

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
    });

export default app;