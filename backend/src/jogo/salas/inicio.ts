import { Contexto } from "../contexto.ts";
import { EntidadeBase, type EntidadeInicial } from "../entidades/base.ts";
import { entidadesContainer } from "../entidades/container.ts";
import { EntidadePorta } from "../entidades/porta.ts";
import type { ItemBase } from "../itens/base.ts";
import { itensPadrao } from "../itens/inicio.ts";
import type { Estado, MaybePromise } from "../types.ts";
import { SalaBase, type AcoesCallbackResult, type ItemInicial } from "./base.ts";
import { salasClareira } from "./clareira.ts";

class Quarto extends SalaBase {
    static nome = "Quarto";
    static itensIniciais = (): ItemInicial[] => [{ 
        item: itensPadrao.Lampiao, 
        quantidade: 1,
        estadoInicial: {
            luz: false
        }
    }, {
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

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "S": Inicio,
            "DORMIR": async () => {
                if(!ctx.jogador.terminouTutorial()) {
                    const moedas = ctx.jogador.obterItensPorNome(itensPadrao.Moedas).at(0);
                    if(moedas && moedas.item.quantidade >= 100) {
                        ctx.escrevaln("Você deita na cama e dorme por um tempo...");
                        ctx.escrevaln("** BAM! (som de pedras caindo) **");
                        ctx.escrevaln();
                        ctx.escrevaln("Um barulho alto te acorda, parece que algo quebrou na sala ao lado.");
                        await ctx.alterarEntidade(ctx.jogador, { estado: { terminouTutorial: true } });
                        return;
                    }
                }
                return "Você deita na cama e dorme por um tempo, mas nada mudou quando acorda.";
            }
        };
    }
}

class Inicio extends SalaBase {
    static nome = "Inicio";
    static itensIniciais = (): ItemInicial[] => [{
        item: itensPadrao.Papel,
        quantidade: 5,
        estadoInicial: {
            texto: ""
        }
    }];
    static entidadesIniciais = (): EntidadeInicial[] => [{
        entidade: EntidadePorta,
        nome: "PortaInicio"
    }];
    static estadoInicial = (): Estado => ({ luz: true });

    descricao(ctx: Contexto) {
        if(!ctx.jogador.terminouTutorial()) {
            return "Você acorda em uma sala sem janelas (subsolo?), você não sabe porquê está aqui, ao norte há um quarto, Ao leste há uma porta";
        } else {
            return "Você está em uma sala com um buraco enorme na parede a oeste, ao norte há um quarto, Ao leste há uma porta";
        }
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "N": Quarto,
            "L": () => {
                const porta = this.obterEntidadePorNome(EntidadePorta, "PortaInicio").at(0);
                if(!porta?.estaAberto()) {
                    return "A Porta está fechada";
                }
                return Labirinto1
            },
            ...(ctx.jogador.terminouTutorial() ? {
                "O": salasClareira.BuracoNaParede
            }: {})
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

    static entidadesIniciais = (): EntidadeInicial[] => [{
        entidade: EntidadePorta,
        ref: { sala: Inicio, nome: "PortaInicio" }
    }];

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "O": () => {
                const porta = this.obterEntidadePorNome(EntidadePorta, "PortaInicio").at(0);
                if(!porta?.estaAberto()) {
                    return "A Porta está fechada";
                }
                return Inicio
            },
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
            "N": () => {
                ctx.escrevaln("Você sobe em uma pedra para passar mas tropeça e cai...");
                return Labirinto4
            }
        };
    }
}

class EntidadePoco extends EntidadeBase {
    static nome = "Poco";

    descricao(ctx: Contexto) {
        const corda = this.obterItensPorNome(itensPadrao.Corda).at(0);
        if(this.ehReferencia) {
            if(corda) {
                return "Um poço com uma corda descendo lá do alto, dá para subir por ela.";
            } else {
                return "Um poço, bem alto com paredes lisas, não há como subir.";
            }
        } else {
            if(corda) {
                return "Um poço no meio da caverna, há uma corda amarrada nele, dá para descer por ela.";
            } else {
                return "Um poço no meio da caverna";
            }
        }
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        const corda = this.obterItensPorNome(itensPadrao.Corda).at(0);
        if(this.ehReferencia) {
            return {
                "SUBIR": () => {
                    if(corda) {
                        const pedras = ctx.jogador.obterItensPorNome(itensPadrao.Pedra).at(0);
                        if(pedras && pedras.item.quantidade > 1) {
                            return "Você tenta subir a corda, mas está carregando pedras demais...";
                        }
                        ctx.escrevaln("Você sobe a corda e chega de volta na sala com o poço.");
                        return Labirinto3;
                    } else {
                        return "Você não tem como subir, não há nenhuma corda descendo até aqui.";
                    }
                }
            };
        } else {
            return {
                "DESCER": () => {
                    if(corda) {
                        ctx.escrevaln("Você desce a corda e chega ao fundo do poço.");
                        return SalaPoco;
                    } else {
                        return "Você não tem como descer, não há nenhuma corda aqui.";
                    }
                },
                ...(!corda ? {"AMARRAR": async () => {
                    const jogadorCorda = ctx.jogador.obterItensPorNome(itensPadrao.Corda).at(0);
                    if(jogadorCorda) {
                        await ctx.moverItem(jogadorCorda, { quantidade: 1, onde: this });
                        return "Você amarra a corda no poço, agora dá para descer por ela.";
                    } else {
                        return "Você não tem nenhuma corda para amarrar no poço.";
                    }
                }} : {}),
            };
        }
    }

    getFilhosVisiveis(): { itens: ItemBase[]; filhos: EntidadeBase[]; } {
        if(!this.ehReferencia) { 
            return super.getFilhosVisiveis();
        } else {
            return { itens: [], filhos: [] };
        }
    }
}

class Labirinto3 extends Labirinto {
    static nome = "Labirinto3";
    static entidadesIniciais = (): EntidadeInicial[] => [{
        entidade: EntidadePoco,
        nome: "PocoLabirinto"
    }];
    static estadoInicial = (): Estado => ({ luz: true });

    descricao(ctx: Contexto): string {
        return "Você está em uma caverna, um pouco da luz do sol entra por uma abertura no alto, você vê uma ponte de cordas cruzando por cima de você, há um poço no meio da sala.";
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "N": () => {
                ctx.escrevaln("A passagem dá algumas voltas e você acaba voltando para onde estava.");
            },
            "S": Labirinto6
        };
    }
}

class SalaPoco extends SalaBase {
    static nome = "Poco";
    static estadoInicial = (): Estado => ({ luz: false });
    static itensIniciais = (): ItemInicial[] => [{ 
        item: itensPadrao.Pedra, 
        quantidade: 5
    }];
    static entidadesIniciais = (): EntidadeInicial[] => [{
        entidade: EntidadePoco,
        ref: { sala: Labirinto3, nome: "PocoLabirinto" }
    }];

    descricao(ctx: Contexto) {
        return "Você está no fundo de um poço na caverna.";
    }
}

class Labirinto4 extends Labirinto {
    static nome = "Labirinto4";
    static estadoInicial = (): Estado => ({ luz: false });

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "N": Labirinto1,
            "O": () => {
                ctx.escrevaln("Você passa por uma passagem estreita cheia de curvas")
                return Labirinto7
            },
            "L": Labirinto5
        };
    }
}

class Labirinto5 extends Labirinto {
    static nome = "Labirinto5";
    static estadoInicial = (): Estado => ({ luz: false });

    acoes(ctx: Contexto): AcoesCallbackResult {
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

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "N": Labirinto3,
            "O": Labirinto5       
        };
    }
}

class Labirinto7 extends Labirinto {
    static nome = "Labirinto7";
    static estadoInicial = (): Estado => ({ luz: false });

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "N": () => {
                ctx.escrevaln("O caminho ficou muito estreito e não deu para passar...");
            },
            "O": () => {
                ctx.escrevaln("Você passa por uma passagem estreita cheia de curvas")
                return Labirinto4
            },
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

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "N": () => {
                ctx.escrevaln("Você sobe em uma pedra para passar mas tropeça e cai...");
                return Labirinto5;
            },
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

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "N": () => {
                ctx.escrevaln("Você sobe em uma pedra para passar mas tropeça e cai...");
                return Labirinto6;
            },
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

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "DESCER": Labirinto9,
            "L": () => {
                if(ctx.jogador.terminouTutorial()) {
                    return "A ponte está toda quebrada, não dá mais para atravessar.";
                }

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
    static nome = "Bau Tesouro";
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
    
    acoes(ctx: Contexto): AcoesCallbackResult {
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
                    ctx.escrevaln("Depois de todo esse esforço você fica até com sono...");
                    await this.abrir(ctx);
                }
            };
        }
    }

    getFilhosVisiveis(): { itens: ItemBase[]; filhos: EntidadeBase[]; } {
        const pedras = this.onde.obterItensPorNome(itensPadrao.Pedra).at(0);
        const quantas = pedras?.item.quantidade || 0;
        if(quantas === 2) {
            return super.getFilhosVisiveis();
        } else {
            return { itens: [], filhos: [] };
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

    acoes(ctx: Contexto): AcoesCallbackResult {
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
    SalaPoco,
    Caverna,
    Tesouro,
    ...salasLabirinto
};

export const entidadesInicio = {
    BauTesouro,
    EntidadePoco
};