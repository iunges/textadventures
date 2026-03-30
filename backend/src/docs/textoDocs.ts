import z from "zod";
import { type DocPaths } from "../utils/docs.ts";

export const textoDocs = {
    "/texto": {
        post: {
            summary: "Envia um comando de texto para ser processado",
            description: "Envia um comando de texto para ser processado, como se o jogador tivesse digitado algo. O comando é processado no contexto da sala atual do jogador",
            schema: {
                body: z.object({
                    cores: z.coerce.boolean().optional().meta({
                        description: "Se a resposta deve conter códigos de cores ANSI para formatação. Útil para clientes que suportam essas formatações, como terminais ou alguns clientes personalizados.",
                    }),
                    comando: z.string().max(1024).meta({
                        description: "Comando de texto a ser processado, como se o jogador tivesse digitado algo. Exemplo: 'olhar', 'pegar chave', 'usar chave na porta'",
                        example: "olhar",
                    }),                    
                }),
                response: z.string().meta({
                    description: "Resposta do comando de texto, geralmente a descrição da sala ou o resultado da ação",
                    example: "Você está em uma sala iluminada. Há uma porta ao norte e uma janela ao sul.",
                }),
            }
        }
    }
} satisfies DocPaths;