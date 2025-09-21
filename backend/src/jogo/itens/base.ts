import type { Item } from "../../db/itemSchema.ts";
import type { Contexto } from "../contexto.ts";
import { EntidadeBase } from "../entidades/base.ts";
import { SalaBase, type AcoesCallbackResult } from "../salas/base.ts";
import type { ArrowOrValue, Estado, MaybePromise } from "../types.ts";

export interface ItemBaseStatic {
    nome: string;
    estadoInicial?: () => Estado;
}

export abstract class ItemBase {    
    descricao(ctx: Contexto): MaybePromise<string | void> {
        return;
    }
    acoes(ctx: Contexto, extra?: Estado | null): MaybePromise<AcoesCallbackResult> {
        return {};
    }

    async _acoes(ctx: Contexto, extra?: Estado | null): Promise<AcoesCallbackResult> {
        const acoes: AcoesCallbackResult = {};

        if(this.onde instanceof EntidadeBase && this.onde.entidade.id === ctx.jogador.entidade.id) {
            acoes["LARGAR"] = async () => {
                await ctx.moverItem(this, { 
                    quantidade: extra?.quantidade && typeof extra?.quantidade === "number" ? extra.quantidade : 1,
                    ondeId: ctx.sala.sala.id
                });
                return "Largou.";
            };
        } else if(this.onde instanceof SalaBase && this.onde.sala.id === ctx.sala.sala.id) {
            acoes["PEGAR"] = async () => {
                await ctx.moverItem(this, { 
                    quantidade: extra?.quantidade && typeof extra?.quantidade === "number" ? extra.quantidade : 1,
                    ondeId: ctx.jogador.entidade.id
                });
                return "Pegou.";
            };
        }

        return {
            "$DESCRICAO": async () => await this.descricao(ctx),
            ...acoes,
            ...(await this.acoes(ctx, extra))
        };
    }

    item: Item;
    onde: SalaBase | EntidadeBase;
    constructor(info: {item: Item, onde: SalaBase | EntidadeBase}) {
        this.item = info.item;
        this.onde = info.onde;
    }

    temLuz(): boolean {
        if(this.item.estado?.luz === true) return true;
        else return false;
    }

    estaVisivel() {
        return true;
    }
}