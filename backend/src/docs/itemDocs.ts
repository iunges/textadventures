import z from "zod";
import { DocPaths } from "../utils/docs.ts";

export const itemDocs = {
    "/item/pegar": {
        post: {
            summary: "Pega um item do chão",
            description: "Adiciona um item, que está no chão da sala atual, ao inventário do jogador.",
            schema: {
                body: z.object({
                    item: z.string().meta({
                        description: "nome do item a ser pego",
                        example: "pedra",
                    }),
                }),
                response: z.object({
                    resposta: z.string().meta({
                        example: "Você pegou a pedra.",
                    }),
                })
            }
        }
    },
    "/item/largar": {
        post: {
            summary: "Larga um item da mochila",
            description: "Remove um item da mochila do jogador e o coloca no chão da sala atual.",
            schema: {
                body: z.object({
                    item: z.string().meta({
                        description: "Nome do item a ser largado da mochila",
                        example: "pedra",
                    }),
                }),
                response: z.object({
                    resposta: z.string().meta({
                        example: "Você largou a pedra no chão.",
                    }),
                })
            }
        }
    }
} satisfies DocPaths;