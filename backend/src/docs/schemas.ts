import z from "zod";

export const respostaItem = z.object({
    id: z.uuid().meta({ example: "UUID" }),
    tipo: z.string().meta({ example: "pedra" }),
    quantidade: z.number().meta({ example: 1 }),
    atualizadoEm: z.iso.datetime().meta({ example: "2023-10-05T14:48:00.000Z" }),
    descricao: z.string().meta({ example: "Uma pedra comum." }),
    acoes: z.array(z.string().meta({ example: "LARGAR" })),
});

export const respostaEntidade = z.object({
    id: z.string().meta({ example: "Inicio" }),
    tipo: z.string().meta({ example: "JOGADOR" }),
    username: z.string().meta({
        example: "usuario123",
    }),
    descricao: z.string().meta({ example: "" }),
    acoes: z.array(z.string().meta({ example: "FALAR" })),
    itens: z.array(respostaItem).optional(),
    criadoEm: z.iso.datetime().meta({ example: "2023-10-05T14:48:00.000Z" }),
    atualizadoEm: z.iso.datetime().meta({ example: "2023-10-05T14:48:00.000Z" }),
});

export const respostaSituacao = z.object({
    resposta: z.string().meta({
        example: "Você não pode fazer isso.",
    }),
    jogador: respostaEntidade.extend({
        ondeId: z.string().meta({
            example: "Inicio",
        }),
    }),
    sala: z.object({
        id: z.string().meta({ example: "Inicio" }),
        descricao: z.string().meta({
            example: "Você está em uma sala iluminada. Há uma porta ao norte e uma janela ao sul.",
        }),
        conexoes: z.array(z.string()).meta({
            example: ["N", "S"],
        }),
        atualizadoEm: z.iso.datetime().meta({ example: "2023-10-05T14:48:00.000Z" }),
        itens: z.array(respostaItem).optional(),
        entidades: z.array(respostaEntidade).optional(),
    }).optional(),
});

export const authUserSchema = z.object({
    id: z.uuid().meta({
        example: "UUID",
    }),
    username: z.string().meta({
        example: "usuario123",
    }),
    createdAt: z.iso.datetime().meta({
        example: "2023-10-05T14:48:00.000Z",
    }),
    token: z.string().meta({
        example: "JWT_TOKEN",
    }),
});

export const acaoExtraSchema = z.object({
    texto: z.string().max(1024).transform((t) => {
        return t.replaceAll(/[^\x20-\x7E]+/g,"");
    }).optional().meta({ 
        description: "Texto a ser escrito, deve ser apenas caracteres ASCII (ESCREVER)" 
    }),

    quantidade: z.number().optional().meta({
        description: "Quantidade a ser usada na ação (PEGAR, LARGAR)",
    }),

    item: z.uuid().optional().meta({
        description: "ID do item a ser usado na ação (USAR, COLOCAR)",
    }),

    entidade: z.uuid().optional().meta({
        description: "ID da entidade a ser usada na ação (USAR, DAR)",
    }),
});
export type AcaoExtra = z.infer<typeof acaoExtraSchema>;