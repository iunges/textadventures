export const itensInicio = {
    Pedra: {
        descricao: () => "Pedra comum, redonda e cinza.",
    },
    Moedas: {
        descricao: () => "Moedas antigas, parecem ser de ouro maciço.",
    },
    Lampiao: {
        descricao: () => "Um lampião antigo",
        estadoInicial: {
            luz: true
        }
    },
} as const;