import 'reflect-metadata'; // ¡Obligatorio para TypeORM! Debe ir al principio
import express from 'express';
import { AppDataSource } from './config/database'; // Ajusta la ruta a tu config
import artistRoutes from './artist/artist.route'; // Ajusta la ruta a tu router

const app = express();
const PORT = process.env.PORT || 4001; 

// Middlewares
app.use(express.json()); 

// Rutas
app.use('/api/artists', artistRoutes);

AppDataSource.initialize()
    .then(() => {
        console.log("Connection has been succesfully established");
        
        app.listen(PORT, () => {
            console.log(`Artist service running in port: ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Error when connecting to the db:", error);
    });

export default app;