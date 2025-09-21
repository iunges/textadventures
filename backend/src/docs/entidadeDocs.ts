import z from "zod";
import { type DocPaths } from "../utils/docs.ts";
import { acaoExtraSchema, respostaSituacao } from "./schemas.ts";
import { Acao } from "../jogo/comandos/comandoConfig.ts";

export const entidadeDocs = {
    "/entidade/acao": {
        post: {
            summary: "Realiza uma ação com uma entidade",
            description: "Realiza uma ação específica com uma entidade que está na sala ou na mochila",
            schema: {
                body: z.object({
                    entidade: z.uuid().meta({
                        description: "ID da entidade com a qual realizar a ação",
                        example: "UUID",
                    }),
                    acao: z.enum(Acao).meta({
                        description: "Ação a ser realizada",
                        example: "ABRIR",
                    }),
                    extra: acaoExtraSchema.optional()
                }),
                response: respostaSituacao
            }
        }
    }
} satisfies DocPaths;