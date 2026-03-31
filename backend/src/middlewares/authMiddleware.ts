import { type RequestHandler } from "express";
import { type StringValue } from "ms";
import { verifyJWTToken } from "../utils/jwt.ts";

export const COOKIE_NAME = '__Secure-textadventures.session_token';
export const COOKIE_OPTIONS = {
    maxAge: 24 * 60 * 60 * 1000 * 7, // 7 days
    secure: true,
    httpOnly: true,
    sameSite: "none",
    domain: process.env.COOKIE_DOMAIN || undefined,
    partitioned: true,
} as const;

export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.COOKIE_SECRET || "default_jwt_secret_change_me";
export const JWT_ACCESS_TOKEN_EXPIRATION: StringValue = process.env.JWT_ACCESS_TOKEN_EXPIRATION as StringValue || "1d";

export class RevokeSessionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RevokeSessionError";
    }
}

export const authMiddleware: RequestHandler = async (req, res, next) => {
    let session = req.session || {};

    const matchedToken = req.headers.authorization ? req.headers.authorization.match(/^Bearer\s+(.+)$/) : null;

    // Se não houver sessão por cookie, mas houver um token JWT válido, usa o token para criar a sessão
    if((!session || !session.username) && matchedToken && matchedToken[1]) {
        const token = matchedToken[1];
        try {
            const decoded = await verifyJWTToken(token, ACCESS_TOKEN_SECRET);
            // Finge que é a sessão por cookie
            req.session = { 
                username: decoded.username 
            };
            session = req.session;
        } catch (err) {
            console.error("Erro ao verificar o token JWT:", err);
            throw new RevokeSessionError("Erro no Token de autenticação: "+err);
        }
    }

    if(!session || !session.username) {
        throw new RevokeSessionError("Usuário não autenticado");
    }
    
    next();
};