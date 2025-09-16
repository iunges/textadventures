import { type ItemType } from "../contexto.ts";

export const itensInicio: Record<string, ItemType> = {
    Pedra: {
        descricao: () => "Pedra comum, redonda e cinza.",
    },
    Moedas: {
        descricao: () => "Moedas antigas, parecem ser de ouro maciço.",
    }
};