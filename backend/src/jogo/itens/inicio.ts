import type { Contexto } from "../contexto.ts";
import type { ItemInfo } from "../types.ts";

export const itensInicio = {
    Pedra: {
        descricao: () => "Pedra comum, redonda e cinza.",
    },
    Moedas: {
        descricao: () => "Moedas antigas, parecem ser de ouro maciço.",
    },
    Lampiao: {
        descricao: async (ctx: Contexto, info: ItemInfo) => {
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
        descricao: (ctx: Contexto, info: ItemInfo) => {
            if(info.estado?.texto && typeof info.estado.texto === "string") {
                return "Pedaço de papel, está escrito: \n" + info.estado.texto;
            } else {
                return "Pedaço de papel em branco."
            }
        }
    }
} as const;