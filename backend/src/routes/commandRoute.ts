import express from "express";

export const getCommandRouter = () => {
    const router = express.Router();
    
    router.post("/command", (req, res) => {
        const { command } = req.body;

        if (typeof command !== "string") {
            return res.status(400).json({ error: "Comando inválido" });
        }

        // Aqui você processaria o comando e obteria a resposta do jogo

        res.json({ response: `Comando recebido: ${command}` });
    });
    
    return router;
};