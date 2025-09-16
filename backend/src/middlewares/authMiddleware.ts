import { type RequestHandler } from "express";
import { db } from "../db/drizzle.ts";
import { tableUsers } from "../db/userSchema.ts";

export const authMiddleware: RequestHandler = async (req, res, next) => {
    const session = req.session || {};
    if(!session || !session.username) {
        // console.log("Sessão inválida, criando nova sessão de usuário...");
        /*const userInfo = await db.select().from(tableUsers).limit(1);
        if(!userInfo || userInfo.length === 0 || !userInfo[0]) {
            res.status(401).json({ error: "Usuário não encontrado" });
            return;
        }
        const user = userInfo[0];*/

        /*req.session = {
            ...(req.session || {}),
            id: "00000000-0000-4000-0000-000000000000",
            username: "jogador"
        }*/

        res.status(401).json({ error: "Usuário não autenticado" });
        return;
    }
    
    next();
};