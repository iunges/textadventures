import type { Item } from "../../db/itemSchema.ts";
import type { Contexto } from "../contexto.ts";
import type { AcoesCallbackResult } from "../salas/base.ts";
import type { Estado, MaybePromise } from "../types.ts";
import { ItemBase } from "./base.ts";
/*
export const itensInicio = {
    Pedra: {
        descricao: () => "Pedra comum, redonda e cinza.",
    },
    Moedas: {
        descricao: () => "Moedas antigas, parecem ser de ouro maciço.",
    },
    Lampiao: {
        descricao: async (ctx: Contexto, info: Item) => {
            if(info.estado?.luz) {
                if(info.quantidadeInicial === null && Math.random() < 0.005) { // 0.5% de chance de apagar quando examinado, mas o que fica no chão da sala inicial não apaga
                    // A FAZER: deveria ser uma ação/trigger/listener/etc..., não um efeito colateral de examinar
                    await ctx.moverItem(info as any, { ondeId: info.ondeId, quantidade: 1, estado: { luz: false } });
                    return "Lampião antigo (apagado) *O Lampião se apagou!*";
                } else {
                    return "Lampião antigo (aceso)";
                }
            } else {
                return "Lampião antigo (apagado)";
            }
        },
        estadoInicial: {
            luz: true
        }
    },
    Corda: {
        descricao: () => "Corda resistente, parece que aguenta bastante peso."
    },
    Papel: {
        descricao: (ctx: Contexto, info: Item) => {
            if(info.estado?.texto && typeof info.estado.texto === "string") {
                if(info.estado.texto.length > 32)
                    return "Pedaço de papel, escrito: "+info.estado.texto.substring(0,32)+"...";
                else
                    return "Pedaço de papel, escrito: "+info.estado.texto+"";
            } else {
                return "Pedaço de papel em branco."
            }
        },
        acoes: {
            "LER": (ctx: Contexto, info: Item) => {
                if(info.estado?.texto && typeof info.estado.texto === "string") {
                    return "No papel está escrito: \n" + info.estado.texto;
                } else {
                    return "O papel está em branco.";
                }
            },
            "ESCREVER": async (ctx: Contexto, info: Item, extra?: Estado | null) => {
                let txt = "";
                if(extra?.texto && typeof extra.texto === "string") {
                    txt = extra.texto.replaceAll(/[^\x20-\x7E]+/g,"").substring(0,1024);
                }

                await ctx.moverItem(info as any, { ondeId: info.ondeId, quantidade: 1, estado: { texto: txt } });
                return "Você escreve no papel.";
            }
        }
    }
} as const;*/

class Pedra extends ItemBase {
    static nome = "Pedra";
    descricao(ctx: Contexto) {
        return "Pedra comum, redonda e cinza.";
    }
}
class Moedas extends ItemBase {
    static nome = "Moedas";
    descricao(ctx: Contexto) {
        return "Moedas antigas, parecem ser de ouro maciço.";
    }
}
class Corda extends ItemBase {
    static nome = "Corda";
    descricao(ctx: Contexto) {
        return "Corda resistente, parece que aguenta bastante peso.";
    }
}
class Lampiao extends ItemBase {
    static nome = "Lampiao";
    static estadoInicial = () => ({ luz: false });

    descricao(ctx: Contexto) {
        if(this.item.estado?.luz) {
            return "Lampião antigo (aceso)";
        } else {
            return "Lampião antigo (apagado)";
        }
    }
    async acoes(ctx: Contexto) {
        const item = this.item;
        return {
            "ACENDER": async () => {
                if(item.estado?.luz) {
                    return "O lampião já está aceso.";
                } else {
                    await ctx.moverItem(this, { ondeId: item.ondeId, quantidade: 1, estado: { luz: true } });
                    return "Você acende o lampião.";
                }
            },
            "APAGAR": async () => {
                if(item.estado?.luz) {
                    await ctx.moverItem(this, { ondeId: item.ondeId, quantidade: 1, estado: { luz: false } });
                    return "Você apaga o lampião.";
                } else {
                    return "O lampião já está apagado.";
                }
            }
        };
    }
}
class Papel extends ItemBase {
    static nome = "Papel";
    static estadoInicial = () => ({ texto: "" });

    descricao(ctx: Contexto) {
        const estado = this.item.estado || {};
        if(estado?.texto && typeof estado.texto === "string") {
            if(estado.texto.length > 32)
                return "Pedaço de papel, escrito: "+estado.texto.substring(0,32)+"...";
            else
                return "Pedaço de papel, escrito: "+estado.texto+"";
        } else {
            return "Pedaço de papel em branco."
        }
    }
    async acoes(ctx: Contexto, extra?: Estado | null) {
        const item = this.item;
        return {
            "LER": () => {
                if(item.estado?.texto && typeof item.estado.texto === "string") {
                    return "No papel está escrito: \n" + item.estado.texto;
                } else {
                    return "O papel está em branco.";
                }
            },
            "ESCREVER": async () => {
                let txt = "";
                if(extra?.texto && typeof extra.texto === "string") {
                    txt = extra.texto.replaceAll(/[^\x20-\x7E]+/g,"").substring(0,1024);
                }

                await ctx.moverItem(this, { ondeId: item.ondeId, quantidade: 1, estado: { texto: txt } });
                return "Você escreve no papel.";
            }
        };
    }
}

export const itensPadrao = {
    Pedra,
    Moedas,
    Lampiao,
    Corda,
    Papel
};