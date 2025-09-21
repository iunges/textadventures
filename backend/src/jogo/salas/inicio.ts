import type { Sala } from "../../db/salaSchema.ts";
import { Contexto } from "../contexto.ts";
import type { EntidadeBase, EntidadeInicial } from "../entidades/base.ts";
import { entidadesContainer } from "../entidades/container.ts";
import type { ItemBase } from "../itens/base.ts";
import { itensPadrao } from "../itens/inicio.ts";
import type { Estado, MaybePromise } from "../types.ts";
import { SalaBase, type ItemInicial } from "./base.ts";
/*
export const salasInicio = {
    Quarto: {
        descricao: (ctx: Contexto) => {
            ctx.escrevaln("Você está em um quarto simples sem janelas, na parede há vários riscos 一 二 三, há uma cama, uma mesa com um candelabro e uma porta ao sul");
        },
        conexoes: {
            "S": "Inicio",
            "N": "Cozinha" as any,
            "DORMIR": (ctx: Contexto) => {
                ctx.escrevaln("Você deita na cama e dorme por um tempo, mas nada mudou quando acorda.");
            },
            "ACENDER": async (ctx: Contexto) => {
                let objetos = await ctx.getMochila();
                const [ lampiao ] = objetos.filter((o) => o.nome === "Lampiao");
                if(!lampiao) {
                    ctx.escrevaln("Você não tem nada para acender aqui.");
                    return;
                }

                if(lampiao.estado?.luz) {
                    ctx.escrevaln("O lampião já está aceso.");
                    return;
                }

                await ctx.moverItem(lampiao, { ondeId: lampiao.ondeId, quantidade: 1, estado: { luz: true } });
                ctx.escrevaln("Você acende o lampião.");
            }
        },
        itensIniciais: [{
            nome: "Papel",
            quantidade: 1,
            estadoInicial: {
                texto: "??/??/????: Quantos dias estou aqui? Lembrar: O que tem do outro lado daquela ponte de cordas?"
            }
        },{
            nome: "Papel",
            quantidade: 5,
            estadoInicial: {
                texto: ""
            }
        }],
        
        estadoInicial: {
            luz: true
        }
    },
    Inicio: {
        descricao: async (ctx: Contexto) => {
            ctx.escrevaln("Você acorda em uma sala sem janelas (subsolo?), você não sabe porquê está aqui, ao norte há um quarto, Ao leste há uma passagem");
        },
        conexoes: {
            "L": "Labirinto1",
            "N": "Quarto"
        },
        itensIniciais: [{
            nome: "Lampiao",
            quantidade: 1,
            estadoInicial: {
                luz: false
            }
        }],
        estadoInicial: {
            luz: true
        }
    },
    Labirinto1: {
        descricao: () => "Todos os lados há passagens, tudo igual, não há como saber onde está.",
        conexoes: {
            "O": "Inicio",
            "L": "Labirinto2",
            "S": "Labirinto4"
        },
        estadoInicial: {
            luz: false
        }
    },
    Labirinto2: {
        descricao: () => "Todos os lados há passagens, tudo igual, não há como saber onde está.",
        conexoes: {
            "O": "Labirinto1",
            "S": "Labirinto5",
            "N": "Labirinto4"
        },
        estadoInicial: {
            luz: false
        }
    },
    Labirinto3: {
        descricao: async (ctx: Contexto) => {
            ctx.escrevaln("Você está em uma caverna, um pouco da luz do sol entra por uma abertura no alto, você vê uma ponte de cordas cruzando por cima de você, há um poço no meio da sala.");
        },
        conexoes: {
            "N": "Labirinto3",
            "S": "Labirinto6",
            "DESCER": async (ctx: Contexto) => {
                let objetos = await ctx.getItensNoChao();
                const [ corda ] = objetos.filter((o) => o.nome === "Corda");
                if(corda) {
                    ctx.escrevaln("Você desce a corda e chega ao fundo do poço");
                    await ctx.moverParaSala("Poço");
                } else {
                    ctx.escrevaln("Você não tem como descer, não há nenhuma corda aqui");
                }
            }
        },
        estadoInicial: {
            luz: true
        }
    },
    Labirinto4: {
        descricao: () => "Todos os lados há passagens, tudo igual, não há como saber onde está.",
        conexoes: {
            "N": "Labirinto1",
            "O": "Labirinto7",
            "L": "Labirinto5"
        },
        estadoInicial: {
            luz: false
        }
    },
    Labirinto5: {
        descricao: () => "Todos os lados há passagens, tudo igual, não há como saber onde está.",
        conexoes: {
            "N": "Labirinto2",
            "O": "Labirinto4",
            "L": "Labirinto6"
        },
        estadoInicial: {
            luz: false
        }
    },
    Labirinto6: {
        descricao: () => "Todos os lados há passagens, tudo igual, não há como saber onde está.",
        conexoes: {
            "N": "Labirinto3",
            "O": "Labirinto5"
        },
        estadoInicial: {
            luz: false
        }
    },
    Labirinto7: {
        descricao: () => "Todos os lados há passagens, tudo igual, não há como saber onde está.",
        conexoes: {
            "N": "Labirinto7",
            "O": "Labirinto4",
            "L": "Labirinto8"
        },
        estadoInicial: {
            luz: false
        }
    },
    Labirinto8: {
        descricao: () => "Todos os lados há passagens, tudo igual, não há como saber onde está.",
        conexoes: {
            "N": "Labirinto5",
            "O": "Labirinto7",
            "L": "Labirinto9"
        },
        estadoInicial: {
            luz: false
        },
        itensIniciais: [{
            nome: "Corda",
            quantidade: 1
        }]
    },
    Labirinto9: {
        descricao: () => "Todos os lados há passagens, tudo igual, pela parede há degraus que levam para parte de cima da caverna.",
        conexoes: {
            "N": "Labirinto6",
            "O": "Labirinto8",
            "SUBIR": "Caverna"
        },
        estadoInicial: {
            luz: false
        }
    },
    Poço: {
        descricao: () => "Este é um poço no fundo da caverna.",
        conexoes: {
            "SUBIR": async (ctx: Contexto) => {
                let objetos = await ctx.getItensNoChao("Labirinto3");
                const [ corda ] = objetos.filter((o) => o.nome === "Corda");
                if(corda) {
                    ctx.escrevaln("Você sobe a corda e chega de volta na sala com o poço");
                    await ctx.moverParaSala("Labirinto3");
                } else {
                    ctx.escrevaln("Você não tem como subir, não há nenhuma corda descendo até aqui");
                }
            }
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
        descricao: () => "Você está no alto de uma caverna, bem alto uma abertura ilumina o local, cruzando um abismo há uma ponte de cordas ao leste, parece bem frágil, O que será que tem lá?",
        conexoes: {
            "DESCER": "Labirinto9",
            "L": async (ctx: Contexto) => {
                let objetos = await ctx.getMochila();
                const [ pedras ] = objetos.filter((o) => o.nome === "Pedra");
                if(pedras && pedras.quantidade > 1) {
                    ctx.escrevaln("Seu peso faz a ponte balançar e você cai...");
                    const qual = Math.floor(Math.random() * 9) + 1;
                    await ctx.moverParaSala(`Labirinto${qual}` as any);
                } else {
                    await ctx.moverParaSala("Tesouro");
                }
            },
        },
        estadoInicial: {
            luz: true
        }
    },
    Tesouro: {
        descricao: async (ctx: Contexto, info: Sala) => {
            if(info.estado?.bauAberto) {
                ctx.escrevaln("Você está em uma sala de pedra decorada com um baú aberto no centro, sem nada dentro");
            } else {
                ctx.escrevaln("Você está em uma sala de pedra decorada com um baú fechado no centro");
            }
        },
        conexoes: {
            "O": async (ctx: Contexto) => {
                let objetos = await ctx.getMochila();
                const [ pedras ] = objetos.filter((o) => o.nome === "Pedra");
                if(pedras && pedras.quantidade > 1) {
                    ctx.escrevaln("Seu peso faz a ponte balançar e você cai...");
                    const qual = Math.floor(Math.random() * 9) + 1;
                    await ctx.moverParaSala(`Labirinto${qual}` as any);
                } else {
                    await ctx.moverParaSala("Caverna");
                }
            },
            "ABRIR": async (ctx: Contexto, info: Sala) => {
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
            "FECHAR": async (ctx: Contexto, info: Sala) => {
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
} as const;*/

class Quarto extends SalaBase {
    static nome = "Quarto";
    static itensIniciais = (): ItemInicial[] => [{ 
        item: itensPadrao.Papel, 
        quantidade: 1,
        estadoInicial: {
            texto: "??/??/????: Quantos dias estou aqui? Lembrar: O que tem do outro lado daquela ponte de cordas?"
        }
    }];
    static estadoInicial = (): Estado => ({ luz: true });

    descricao(ctx: Contexto) {
        return "Você está em um quarto simples sem janelas, na parede há vários riscos 一 二 三, há uma cama, uma mesa com um candelabro e uma porta ao sul";
    }

    acoes(ctx: Contexto) {
        return {
            "S": Inicio,
            "DORMIR": () => {
                return "Você deita na cama e dorme por um tempo, mas nada mudou quando acorda.";
            }
        };
    }
}

class Inicio extends SalaBase {
    static nome = "Inicio";
    static itensIniciais = (): ItemInicial[] => [{ 
        item: itensPadrao.Lampiao, 
        quantidade: 1,
        estadoInicial: {
            luz: false
        }
    }, {
        item: itensPadrao.Papel,
        quantidade: 5,
        estadoInicial: {
            texto: ""
        }
    }];
    static estadoInicial = (): Estado => ({ luz: true });

    descricao(ctx: Contexto) {
        return "Você acorda em uma sala sem janelas (subsolo?), você não sabe porquê está aqui, ao norte há um quarto, Ao leste há uma passagem";
    }

    acoes(ctx: Contexto) {
        return {
            "N": Quarto,
            "L": Labirinto1
        };
    }
}

class Labirinto extends SalaBase {
    descricao(ctx: Contexto) {
        return "Todos os lados há passagens, tudo igual, não há como saber onde está.";
    }
}

class Labirinto1 extends Labirinto {
    static nome = "Labirinto1";
    static estadoInicial = (): Estado => ({ luz: false });

    acoes(ctx: Contexto) {
        return {
            "O": Inicio,
            "L": Labirinto2,
            "S": Labirinto4
        };
    }
}

class Labirinto2 extends Labirinto {
    static nome = "Labirinto2";
    static estadoInicial = (): Estado => ({ luz: false });

    acoes(ctx: Contexto) {
        return {
            "O": Labirinto1,
            "S": Labirinto5,
            "N": Labirinto4
        };
    }
}

class Labirinto3 extends Labirinto {
    static nome = "Labirinto3";
    static estadoInicial = (): Estado => ({ luz: true });

    descricao(ctx: Contexto): string {
        return "Você está em uma caverna, um pouco da luz do sol entra por uma abertura no alto, você vê uma ponte de cordas cruzando por cima de você, há um poço no meio da sala.";
    }

    acoes(ctx: Contexto) {
        return {
            "N": Labirinto3,
            "S": Labirinto6,
            "DESCER": () => {
                const result = this.obterItensPorNome(itensPadrao.Corda).at(0);
                if(result) {
                    ctx.escrevaln("Você desce a corda e chega ao fundo do poço.");
                    return Poco;
                } else {
                    return "Você não tem como descer, não há nenhuma corda aqui.";
                }
            }
        };
    }
}

class Poco extends SalaBase {
    static nome = "Poco";
    static estadoInicial = (): Estado => ({ luz: false });
    static itensIniciais = (): ItemInicial[] => [{ 
        item: itensPadrao.Pedra, 
        quantidade: 5
    }];

    descricao(ctx: Contexto) {
        return "Este é um poço no fundo da caverna.";
    }

    acoes(ctx: Contexto) {
        return {
            "SUBIR": async () => {
                // A FAZER: essa é a melhor forma?
                await ctx.moverParaSala(Labirinto3);
                const result = ctx.sala.obterItensPorNome(itensPadrao.Corda).at(0);
                if(result) {
                    ctx.escrevaln("Você sobe a corda e chega de volta na sala com o poço.");
                } else {
                    await ctx.moverParaSala(Poco);
                    return "Você não tem como subir, não há nenhuma corda descendo até aqui.";
                }
            }
        };
    }
}

class Labirinto4 extends Labirinto {
    static nome = "Labirinto4";
    static estadoInicial = (): Estado => ({ luz: false });

    acoes(ctx: Contexto) {
        return {
            "N": Labirinto1,
            "O": Labirinto7,
            "L": Labirinto5
        };
    }
}

class Labirinto5 extends Labirinto {
    static nome = "Labirinto5";
    static estadoInicial = (): Estado => ({ luz: false });

    acoes(ctx: Contexto) {
        return {
            "N": Labirinto2,
            "O": Labirinto4,
            "L": Labirinto6
        };
    }
}

class Labirinto6 extends Labirinto {
    static nome = "Labirinto6";
    static estadoInicial = (): Estado => ({ luz: false });

    acoes(ctx: Contexto) {
        return {
            "N": Labirinto3,
            "O": Labirinto5       
        };
    }
}

class Labirinto7 extends Labirinto {
    static nome = "Labirinto7";
    static estadoInicial = (): Estado => ({ luz: false });

    acoes(ctx: Contexto) {
        return {
            "N": Labirinto7,
            "O": Labirinto4,
            "L": Labirinto8
        };
    }
}

class Labirinto8 extends Labirinto {
    static nome = "Labirinto8";
    static estadoInicial = (): Estado => ({ luz: false });
    static itensIniciais = (): ItemInicial[] => [{ 
        item: itensPadrao.Corda, 
        quantidade: 1
    }];

    acoes(ctx: Contexto) {
        return {
            "N": Labirinto5,
            "O": Labirinto7,
            "L": Labirinto9
        };
    }
}

class Labirinto9 extends Labirinto {
    static nome = "Labirinto9";
    static estadoInicial = (): Estado => ({ luz: false });

    descricao(ctx: Contexto): string {
        return "Todos os lados há passagens, tudo igual, pela parede há degraus que levam para parte de cima da caverna.";
    }

    acoes(ctx: Contexto) {
        return {
            "N": Labirinto6,
            "O": Labirinto8,
            "SUBIR": Caverna        
        };
    }
}
const salasLabirinto = {Labirinto1, Labirinto2, Labirinto3, Labirinto4, Labirinto5, Labirinto6, Labirinto7, Labirinto8, Labirinto9};

class Caverna extends SalaBase {
    static nome = "Caverna";
    static estadoInicial = (): Estado => ({ luz: true });

    descricao(ctx: Contexto): MaybePromise<string | void> {
        return "Você está no alto de uma caverna, bem alto uma abertura ilumina o local, cruzando um abismo há uma ponte de cordas ao leste, parece bem frágil, O que será que tem lá?";
    }

    acoes(ctx: Contexto) {
        return {
            "DESCER": Labirinto9,
            "L": () => {
                let pedras = ctx.jogador.obterItensPorNome(itensPadrao.Pedra).at(0);
                if(pedras && pedras.item.quantidade > 1) {
                    ctx.escrevaln("Seu peso faz a ponte balançar e você cai...");
                    const [nome, classeSala] = Object.entries(salasLabirinto)[Math.floor(Math.random() * 9)];
                    return classeSala;
                } else {
                    return Tesouro;
                }
            },
        };
    }
}

class BauTesouro extends entidadesContainer.Bau {
    static nome = "BauTesouro";
    static estadoInicial = () => ({ aberto: false });

    descricao(ctx: Contexto) {
        const pedras = this.onde.obterItensPorNome(itensPadrao.Pedra).at(0);
        const quantas = pedras?.item.quantidade || 0;
        const descrPedestal = quantas === 0 ? " sem nada neles" : quantas === 1 ? ", um deles tem uma pedra em cima" : quantas === 2 ? ", cada uma com uma pedra" : ", mas parece que tem pedras demais aqui";
        if(this.estaAberto()) {
            return `Grande baú aberto no centro da sala. há dois pedestais em cada lado do baú${descrPedestal}.`;
        } else {
            return `Grande baú fechado no centro da sala, há dois pedestais em cada lado do baú${descrPedestal}.`;
        }
    }
    
    acoes(ctx: Contexto, extra?: Estado | null) {
        const pedras = this.onde.obterItensPorNome(itensPadrao.Pedra).at(0);
        if(this.estaAberto()) {
            return {
                "FECHAR": async () => {
                    if(!pedras || pedras.item.quantidade !== 2) {
                        return "Você não consegue alcançar o baú para fechá-lo.";
                    }
                    
                    ctx.escrevaln("Você sobe nas pedras e fecha o baú.");
                    await this.fechar(ctx);
                }
            };
        } else {
            return {
                "ABRIR": async () => {
                    if(!pedras) {
                        return "O baú está muito alto, você não consegue alcançá-lo, se tivesse algo para subir...";
                    } else if(pedras.item.quantidade === 1) {
                        return "Você sobe na pedra mas ainda não alcança o baú.";
                    } else if (pedras.item.quantidade > 2) {
                        return "Parece que tem pedras demais aqui, nem consegue ver o baú direito.";
                    }
                    
                    ctx.escrevaln("Você sobe nas pedras e alcança o baú, abrindo-o com facilidade.");
                    await this.abrir(ctx);
                }
            };
        }
    }
}

class Tesouro extends SalaBase {
    static nome = "Tesouro";
    static estadoInicial = (): Estado => ({ luz: false });
    static entidadesIniciais = (): EntidadeInicial[] => [{
        entidade: BauTesouro,
        estadoInicial: { aberto: false },
        itensIniciais: [{
            item: itensPadrao.Moedas,
            quantidade: 100
        }]
    }]

    descricao(ctx: Contexto) {
        return "Você está em uma sala de pedra decorada";
    }

    acoes(ctx: Contexto) {
        return {
            "O": () => {
                let pedras = ctx.jogador.obterItensPorNome(itensPadrao.Pedra).at(0);
                if(pedras && pedras.item.quantidade > 1) {
                    ctx.escrevaln("Seu peso faz a ponte balançar e você cai...");
                    const [nome, classeSala] = Object.entries(salasLabirinto)[Math.floor(Math.random() * 9)];
                    return classeSala;
                } else {
                    return Caverna;
                }
            }
        };
    }
}

export const salaasInicio = {
    Quarto,
    Inicio,
    Poco,
    Caverna,
    Tesouro,
    ...salasLabirinto
};

export const entidadesInicio = {
    BauTesouro
};