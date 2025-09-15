import { RequestHandler } from "express";
import { Contexto } from "../jogo/contexto.ts";
import { parseRequest } from "../utils/docs.ts";
import { itemDocs } from "../docs/itemDocs.ts";

export class ItemController {
    static pegarItem: RequestHandler = async (req, res) => {
        const usuario = res.locals.auth!.user;
        const { body } = parseRequest(itemDocs["/item/pegar"].post.schema, req);

        const ctx = await Contexto.carregar(usuario.id);

        let objetos = await ctx.getItensNoChao();
        if (objetos.length == 0) {
            ctx.escrevaln("Não tem nada para pegar.");
        } else {
            const objeto = objetos.find(o => o.tipo === body.item);
            if (!objeto) {
                ctx.escrevaln("Não tem isso aqui.");
            } else {
                await ctx.moverItem(objeto, { entidadeId: ctx.jogador.id });
            }
        }

        await ctx.salvar();
        res.json({ resposta: ctx.obterTexto() });
    }

    static largarItem: RequestHandler = async (req, res) => {
        const usuario = res.locals.auth!.user;
        const { body } = parseRequest(itemDocs["/item/largar"].post.schema, req);

        const ctx = await Contexto.carregar(usuario.id);

        let objetos = await ctx.getMochila();
        if (objetos.length == 0) {
            ctx.escrevaln("Não tem nada na mochila.");
        } else {
            const objeto = objetos.find(o => o.tipo === body.item);
            if (!objeto) {
                ctx.escrevaln("Não tem isso na mochila.");
            } else {
                await ctx.moverItem(objeto, { salaId: ctx.jogador.salaId });
            }
        }

        await ctx.salvar();
        res.json({ resposta: ctx.obterTexto() });
    }
}