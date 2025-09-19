import type { SalaInfo } from "../types.ts";
import { Contexto } from "../contexto.ts";

export const salasInicio = {
    Inicio: {
        descricao: async (ctx: Contexto) => {
            ctx.escrevaln("Você acorda em uma sala sem janelas (subsolo?), você não sabe porquê está aqui. Ao leste há uma passagem");
        },
        conexoes: {
            "L": () => "Labirinto1" as const,
        },
        itensIniciais: [{
            nome: "Lampiao",
            quantidade: 1,
            estadoInicial: {
                luz: true
            }
        }],
        estadoInicial: {
            luz: false
        }
    },
    Labirinto1: {
        descricao: () => "Todos os lados há passagens, tudo igual, não há como saber onde está.",
        conexoes: {
            "O": () => "Labirinto1" as const,
            "L": () => "Labirinto2" as const,
            "S": () => "Labirinto4" as const
        },
        estadoInicial: {
            luz: false
        }
    },
    Labirinto2: {
        descricao: () => "Todos os lados há passagens, tudo igual, não há como saber onde está.",
        conexoes: {
            "O": () => "Inicio" as const,
            "S": () => "Labirinto5" as const
        },
        estadoInicial: {
            luz: false
        }
    },
    Labirinto3: {
        descricao: () => "Você achou uma sala com uma rachadura no teto, onde há alguns galhos e luz do sol, há uma corda que desce em um poço",
        conexoes: {
            "N": () => "Labirinto3" as const,
            "S": () => "Labirinto6" as const,
            "DESCER": () => "Poço" as const,
        },
        estadoInicial: {
            luz: true
        }
    },
    Labirinto4: {
        descricao: () => "Todos os lados há passagens, tudo igual, não há como saber onde está.",
        conexoes: {
            "N": () => "Labirinto1" as const,
            "O": () => "Labirinto7" as const,
            "L": () => "Labirinto5" as const
        },
        estadoInicial: {
            luz: false
        }
    },
    Labirinto5: {
        descricao: () => "Todos os lados há passagens, tudo igual, não há como saber onde está.",
        conexoes: {
            "N": () => "Labirinto2" as const,
            "O": () => "Labirinto4" as const,
            "L": () => "Labirinto6" as const
        },
        estadoInicial: {
            luz: false
        }
    },
    Labirinto6: {
        descricao: () => "Todos os lados há passagens, tudo igual, não há como saber onde está.",
        conexoes: {
            "N": () => "Labirinto3" as const,
            "O": () => "Labirinto5" as const
        },
        estadoInicial: {
            luz: false
        }
    },
    Labirinto7: {
        descricao: () => "Todos os lados há passagens, tudo igual, não há como saber onde está.",
        conexoes: {
            "N": () => "Labirinto7" as const,
            "O": () => "Labirinto4" as const,
            "L": () => "Labirinto8" as const
        },
        estadoInicial: {
            luz: false
        }
    },
    Labirinto8: {
        descricao: () => "Todos os lados há passagens, tudo igual, não há como saber onde está.",
        conexoes: {
            "N": () => "Labirinto5" as const,
            "O": () => "Labirinto7" as const,
            "L": () => "Labirinto9" as const
        },
        estadoInicial: {
            luz: false
        }
    },
    Labirinto9: {
        descricao: () => "Todos os lados há passagens, tudo igual, não há como saber onde está.",
        conexoes: {
            "N": () => "Labirinto6" as const,
            "O": () => "Labirinto8" as const,
            "S": () => "Caverna" as const
        },
        estadoInicial: {
            luz: false
        }
    },
    Poço: {
        descricao: () => "Este é um poço no fundo da caverna, para subir há uma corda",
        conexoes: {
            "SUBIR": () => "Labirinto3" as const
        },
        itensIniciais: [{
            nome: "Pedra",
            quantidade: 5
        }],
        estadoInicial: {
            luz: false
        }
    },
    Caverna: {
        descricao: () => `Você está em uma caverna escura,
        Há uma ponte de cordas ao leste, parece bem frágil, O que será que tem lá?
        `,
        conexoes: {
            "O": () => "Labirinto9" as const,
            "L": async (ctx: Contexto) => {
                let objetos = await ctx.getMochila();
                const [ pedras ] = objetos.filter((o) => o.nome === "Pedra");
                if(pedras && pedras.quantidade > 1) {
                    ctx.escrevaln("Seu peso faz a ponte balança e você cai no Poço abaixo");
                    await ctx.moverParaSala("Poço");
                } else {
                    await ctx.moverParaSala("Tesouro");
                }
            },
        },
        estadoInicial: {
            luz: false
        }
    },
    Tesouro: {
        descricao: async (ctx: Contexto, info: SalaInfo) => {
            if(info.estado?.bauAberto) {
                ctx.escrevaln("Você está em uma sala de pedra decorada com um baú aberto no centro, sem nada dentro");
            } else {
                ctx.escrevaln("Você está em uma sala de pedra decorada com um baú fechado no centro");
            }
        },
        conexoes: {
            "O": (ctx: Contexto) => {
                ctx.escrevaln("Você escorrega e cai no poço abaixo");
                return "Poço" as const;
            },
            "ABRIR": async (ctx: Contexto, info: SalaInfo) => {
                if(info.estado?.bauAberto) {
                    ctx.escrevaln("O baú já está aberto, sem nada dentro");
                    return;
                }

                let objetos = await ctx.getItensNoChao();
                const [ pedras ] = objetos.filter((o) => o.nome === "Pedra");
                if(!pedras) {
                    ctx.escrevaln("O baú está muito alto, você não consegue alcançá-lo, se tivesse algo para subir...");
                    return;
                }

                if(pedras.quantidade === 2) {
                    ctx.escrevaln("Você sobe nas pedras e alcança o baú, abrindo-o com facilidade");
                    ctx.escrevaln("Você abre o baú e está cheio de moedas que "+
                        "após uma análise minuciosa, você as identifica como fabricadas "+
                        "por volta de 200 AC, com inscrições de Alexandre o Grande"
                    );
                    
                    await ctx.criarItem({ nome: "Moedas", quantidade: 100, ondeId: ctx.jogador.id });
                    await ctx.alterarEstadoSala({ bauAberto: true });
                } else if (pedras.quantidade > 2) {
                    ctx.escrevaln("Parece que tem pedras demais aqui, nem consegue ver o baú direito");
                } else {
                    ctx.escrevaln("Você sobe na pedra mas ainda não alcança o baú");
                }
            },
            "FECHAR": async (ctx: Contexto, info: SalaInfo) => {
                if(!info.estado?.bauAberto) {
                    ctx.escrevaln("O baú já está fechado");
                    return;
                }

                let objetos = await ctx.getItensNoChao();
                const [ pedras ] = objetos.filter((o) => o.nome === "Pedra");
                if(!pedras || pedras.quantidade !== 2) {
                    ctx.escrevaln("Você não consegue alcançar o baú para fechá-lo");
                    return;
                }

                ctx.escrevaln("Você sobe nas pedras e fecha o baú, mas aí você escorrega e as pedras caem em um poço");
                await ctx.alterarEstadoSala({ bauAberto: false });
                await ctx.moverItem(pedras, { quantidade: 2, ondeId: null });
            }
        },
        estadoInicial: {
            bauAberto: false,
            luz: false
        }
    },
} as const;