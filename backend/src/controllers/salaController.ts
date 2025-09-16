import { type RequestHandler } from "express";
import { SalaRepository } from "../repositories/salaRepository.ts";
import { db } from "../db/drizzle.ts";
import { Contexto } from "../jogo/contexto.ts";
import { getSalaConfig } from "../jogo/salas/salas.ts";
import { parseRequest } from "../utils/docs.ts";
import { salaDocs } from "../docs/salaDocs.ts";
import type { User } from "../db/userSchema.ts";

export class SalaController {
    static descreverSalaAtual: RequestHandler = async (req, res) => {
        const usuario = req.session! as User;

        const ctx = await Contexto.carregar(usuario.username);

        const result = await ctx.descricaoSala();
        await ctx.salvar();

        res.json({
            ...ctx.retornarSituacao(),
            sala: result
        });
    }

    static moverParaDirecao: RequestHandler<{ direcao: string }> = async (req, res) => {
        const usuario = req.session! as User;
        const { body } = parseRequest(salaDocs["/sala/mover"].post.schema, req);

        const ctx = await Contexto.carregar(usuario.username);

        const salaConfig = getSalaConfig((await ctx.getSala()).nome);
        const conexao = body.direcao in salaConfig.conexoes && salaConfig.conexoes[body.direcao];
        if(!conexao) {
            ctx.escrevaln("Você não pode fazer isso.");
        } else {
            const novaSalaNome = await conexao(ctx);
            if(novaSalaNome) {
                await ctx.moverParaSala(novaSalaNome);
            }
        }

        await ctx.salvar();
        res.json({ ...ctx.retornarSituacao() });
    }
}