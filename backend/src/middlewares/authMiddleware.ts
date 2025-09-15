import { RequestHandler } from "express";
import { db } from "../db/drizzle.ts";
import { tableUsers } from "../db/userSchema.ts";

export const authMiddleware: RequestHandler = async (req, res, next) => {
    // A FAZER: obter sessão do usuário.
    const userInfo = await db.select().from(tableUsers).limit(1);
    if(!userInfo || userInfo.length === 0 || !userInfo[0]) {
        res.status(401).json({ error: "Usuário não encontrado" });
        return;
    }
    
    res.locals.auth = {
        user: userInfo[0]
    };
    next();
};