import "dotenv/config";
import express from "express";
import cors from "cors";

import routes from "./routes/index.ts";
import cookieSession from "cookie-session";

const app = express();
// If app is served through a proxy, trust the proxy to allow HTTPS protocol to be detected
// https://expressjs.com/en/guide/behind-proxies.html
app.set('trust proxy', true);

app.use((req, res, next) => {
    try {
        res.locals = res.locals || {};
        res.locals.logData = {
            tempoInicio: performance.now()
        };
    } catch(e) {
        console.error("Erro ao iniciar o log", e);
    }
    next();
});

// ========================================
//             Configuração Cors
// ========================================
let CORS_ORIGINS = process.env.CORS_ORIGINS?.split(",");
if(!CORS_ORIGINS || CORS_ORIGINS.length === 0) {
    throw new Error("ENV CORS_ORIGINS não definido!");
}

// https://www.better-auth.com/docs/integrations/express#cors-configuration
app.use(cors({
    origin: (origin, callback) => {
        // https://www.npmjs.com/package/cors#configuring-cors-w-dynamic-origin
        if(!origin || CORS_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: Não permitido para esta origem: ${origin}`));
        }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"], // Com Bearer token é necessário permitir o cabeçalho Authorization
    credentials: true, // Se utilizar cookies, habilitar isso
    // maxAge: 86400, // Cache the preflight response for 24 hours?
}));


// habilitando o uso de json pelo express
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cookieSession({
  name: 'session',
  keys: [process.env.COOKIE_SECRET!, process.env.COOKIE_SECRET!], 

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  secure: process.env.NODE_ENV === 'production' ? true : false, // set to true in production

  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : "lax",
  // partitioned: true,
}));

// Passando para o arquivo de rotas o app, que envia junto uma instância do express
routes(app);

export default app;