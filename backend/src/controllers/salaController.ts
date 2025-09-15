import { RequestHandler } from "express";
import { SalaRepository } from "../repositories/salaRepository.ts";
import { db } from "../db/drizzle.ts";
import { Contexto } from "../jogo/contexto.ts";
import { getSalaConfig } from "../jogo/salas/salas.ts";
import { parseRequest } from "../utils/docs.ts";
import { salaDocs } from "../docs/salaDocs.ts";

export class SalaController {
    static descreverSalaAtual: RequestHandler = async (req, res) => {
        const usuario = res.locals.auth!.user;

        const ctx = await Contexto.carregar(usuario.id);

        await ctx.descreverSala();
        await ctx.salvar();

        res.json({ 
            resposta: ctx.obterTexto(),
            // itensNoChao: await ctx.getItensNoChao()
        });
    }

    static moverParaDirecao: RequestHandler<{ direcao: string }> = async (req, res) => {
        const usuario = res.locals.auth!.user;
        const { body } = parseRequest(salaDocs["/sala/mover"].post.schema, req);

        const ctx = await Contexto.carregar(usuario.id);

        const salaConfig = getSalaConfig(ctx.jogador.salaId);
        const conexao = body.direcao in salaConfig.conexoes && salaConfig.conexoes[body.direcao];
        if(!conexao) {
            ctx.escrevaln("Você não pode fazer isso.");
        } else {
            const novaSalaId = await conexao(ctx);
            if(novaSalaId) {
                await ctx.moverParaSala(novaSalaId);
            }
        }

        await ctx.salvar();
        res.json({ resposta: ctx.obterTexto() });
    }
}