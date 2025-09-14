import "dotenv/config";
import express from "express";
import cors from "cors";

import routes from "./routes/index.js";

const app = express();

// Habilita o CORS para todas as origens
app.use(cors());

// habilitando o uso de json pelo express
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Passando para o arquivo de rotas o app, que envia junto uma instância do express
routes(app);

export default app;