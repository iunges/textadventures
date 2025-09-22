import type { Contexto } from "../contexto.ts";
import { EntidadeBase, type EntidadeInicial } from "../entidades/base.ts";
import { itensPadrao } from "../itens/inicio.ts";
import { SalaBase, type AcoesCallbackResult, type ItemInicial } from "./base.ts";
import { salaasInicio } from "./inicio.ts"; // Supondo que 'inicio.ts' exporta a classe 'Inicio'

class EntidadePlaca extends EntidadeBase {
    static nome = "Placa";

    descricao(ctx: Contexto) {
        return "Uma placa de madeira simples fincada na beira da estrada.";
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "LER": () => {
                return "A placa aponta para o sul e tem a palavra 'CIDADE' entalhada";
            }
        };
    }
}

class BuracoNaParede extends SalaBase {
    static nome = "BuracoNaParede";
    static estadoInicial = () => ({ luz: true });

    descricao(ctx: Contexto) {
        return "Você está em uma passagem estreita e empoeirada, A sala de onde você veio fica a leste. acima você vê a luz do dia.";
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "L": salaasInicio.Inicio,
            "SUBIR": Clareira
        };
    }
}

class Clareira extends SalaBase {
    static nome = "Clareira";
    static estadoInicial = () => ({ luz: true });

    descricao(ctx: Contexto) {
        return "Você sai em uma clareira, cercada por árvores altas. Há um buraco perto de uma árvore";
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "DESCER": BuracoNaParede,
            "L": Estrada,
            "O": MargemDoRio,
            "N": MargemDoRio,
            "S": Estrada
        };
    }
}

class MargemDoRio extends SalaBase {
    static nome = "MargemDoRio";
    static estadoInicial = () => ({ luz: true });
    static itensIniciais = (): ItemInicial[] => [{ 
        item: itensPadrao.Pedra, 
        quantidade: 3
    }];

    descricao(ctx: Contexto) {
        return "Você chega à margem de um rio largo e de correnteza forte. A água corre rápida demais para tentar atravessar a nado e não há pontes à vista. O único caminho é voltar para a clareira.";
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "S": Clareira,
            "L": Clareira
        };
    }
}

class Estrada extends SalaBase {
    static nome = "Estrada";
    static estadoInicial = () => ({ luz: true });
    static itensIniciais = (): ItemInicial[] => [{ 
        item: itensPadrao.Pedra, 
        quantidade: 1
    }];
    static entidadesIniciais = (): EntidadeInicial[] => [{
        entidade: EntidadePlaca
    }];

    descricao(ctx: Contexto) {
        return "Você está em uma estrada de terra batida que se estende para o sul. Uma placa de madeira está fincada na beira do caminho.";
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "O": Clareira,
            "S": PortaoDaCidade,
            "N": Estrada
        };
    }
}

class PortaoDaCidade extends SalaBase {
    static nome = "PortaoDaCidade";
    static estadoInicial = () => ({ luz: true });

    descricao(ctx: Contexto) {
        return "Após uma curta caminhada, você chega aos grandes portões de uma cidade.";
    }

    acoes(ctx: Contexto): AcoesCallbackResult {
        return {
            "N": Estrada,
            "ENTRAR": () => {
                return "Os portões estão trancados. Você não pode entrar na cidade.";
            }
        };
    }
}

// Exporta as novas salas e entidades para serem usadas no jogo
export const salasClareira = {
    BuracoNaParede,
    Clareira,
    MargemDoRio,
    Estrada,
    PortaoDaCidade,
};

export const entidadesClareira = {
    EntidadePlaca,
};