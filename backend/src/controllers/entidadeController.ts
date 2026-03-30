import { type RequestHandler } from "express";
import { ControllerBase } from "./ControllerBase.ts";
import { execArrowOrValue } from "../jogo/types.ts";
import { entidadeDocs } from "../docs/entidadeDocs.ts";
import type { SalaBase, SalaBaseStatic } from "../jogo/salas/base.ts";
import type { AcaoExtraPopulado } from "../jogo/objetoJogo.ts";
import type { Contexto } from "../jogo/contexto.ts";
import type { AcaoExtra } from "../docs/schemas.ts";
import type { AcaoValue } from "../jogo/comandos/comandoConfig.ts";

export class EntidadeController extends ControllerBase {
    static acaoEntidade: RequestHandler = async (req, res) => {
        const { ctx, body, params } = await this.loadRequest(entidadeDocs["/sala/{salaId}/entidade/{id}/{acao}"].post.schema, req, res);
        if(!ctx) return;
        
        await this._executarAcao(ctx, body, params);

        await this.sendResponse(ctx, req, res);
    }

    static async _executarAcao(ctx: Contexto, body: AcaoExtra | undefined, params: {
        salaId: string;
        id: string;
        acao: AcaoValue;
    }) {
        const entidadeId = params.id;
        
        const achouEntidade = ctx.getEntidadeVisivel(entidadeId);

        if(!achouEntidade) {
            ctx.escrevaln("Não tem isso aqui.");
            return;
        }

        const { item, entidade, ..._extra} = body || {};
        const extra: AcaoExtraPopulado = _extra;
        if(item) {
            extra.item = ctx.getItemVisivel(item) || undefined;
        }
        if(entidade) {
            extra.entidade = ctx.getEntidadeVisivel(entidade) || undefined;
        }

        //const acoes = await execCallbackOrValue(itemConfig.acoes ?? {}, ctx, achouObjeto, body.extra ?? null);
        const acoes = await achouEntidade._acoes(ctx, extra ?? null);
        if(!(params.acao in acoes) || params.acao.startsWith("$")) {
            ctx.escrevaln("Você não pode fazer isso.");
        } else {
            const result = await execArrowOrValue(acoes[params.acao]);
            if(result) {
                if(typeof result !== "string") {
                    await ctx.moverParaSala(result as typeof SalaBase & SalaBaseStatic);
                } else {
                    ctx.escrevaln(result);
                }
            }
        }
    }
}