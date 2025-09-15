import z from "zod";
import { DocPaths } from "../utils/docs.ts";

export const salaDocs = {
    "/sala/olhar": {
        get: {
            summary: "Descreve a sala atual",
            description: "Retorna a descrição completa da sala onde o jogador se encontra, incluindo saídas, itens no chão e outras entidades visíveis.",
            schema: {
                response: z.object({
                    resposta: z.string().meta({
                        example: "Está tudo escuro aqui.",
                    }),
                })
            }
        }
    },
    "/sala/mover": {
        post: {
            summary: "Move o jogador para uma direção",
            description: "Tenta mover o jogador para uma sala adjacente na direção especificada (ex: norte, sul, leste, oeste).",
            schema: {
                body: z.object({
                    direcao: z.string().toUpperCase().meta({
                        description: "Direção para a qual se mover.",
                        example: "norte",
                    }),
                }),
                response: z.object({
                    resposta: z.string().meta({
                        example: "Você não pode fazer isso.",
                    }),
                })
            }
        }
    }
} satisfies DocPaths;