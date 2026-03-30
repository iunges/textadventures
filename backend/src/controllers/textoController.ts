import type { RequestHandler } from "express";
import { ControllerBase } from "./ControllerBase.ts";
import { textoDocs } from "../docs/textoDocs.ts";
import { parseRequest } from "../utils/docs.ts";
import type { User } from "../db/userSchema.ts";
import { UserRepository } from "../repositories/userRepository.ts";
import { db } from "../db/drizzle.ts";
import { RevokeSessionError } from "../middlewares/authMiddleware.ts";
import { Contexto } from "../jogo/contexto.ts";
import { CommandParser, ParserError, type RespostaEntidades, type RespostaItens, type RespostaSituacao } from "../utils/commandParser.ts";
import { Acao, acoesConfig, DIRECOES, type AcaoValue } from "../jogo/comandos/comandoConfig.ts";
import anyAscii from "any-ascii";
import { getChalk } from "../utils/chalk.ts";
import { SalaController } from "./salaController.ts";
import { EntidadeController } from "./entidadeController.ts";
import { ItemController } from "./itemController.ts";
import { stripVTControlCharacters } from "util";

// https://hexdocs.pm/color_palette/ansi_color_codes.html
const chalk = getChalk(true);
const cor = {
    texto: (...args: unknown[]) => chalk.ansi256(248)(...args),
    descricao: (...args: unknown[]) => chalk.reset(...args),
    resposta: (...args: unknown[]) => chalk.red(...args),
    quantidade: (...args: unknown[]) => chalk.ansi256(40)(...args),
    item: (...args: unknown[]) => chalk.ansi256(28)(...args),
    entidade: (...args: unknown[]) => chalk.ansi256(28)(...args),
    acao: (...args: unknown[]) => chalk.ansi256(165)(...args),
};

export const desambiguar = async (
    acao: string | null,
    alvos: Record<string, { sinonimos: string[], ref: RespostaItens | RespostaEntidades }>,
    alvosMatch: { match: string, confidence: number }[],
    arg: number
) => {
    if (!acao) {
        return { item: undefined, entidade: undefined };
    }

    let item: RespostaItens[] = [];
    let entidade: RespostaEntidades[] = [];
    for (let result of alvosMatch) {
        const alvo = alvos[result.match]?.ref;
        if ("tipo" in alvo) {
            if (arg !== 1 || alvo.acoes?.includes(acao))
                entidade.push(alvo);
        } else {
            if (arg !== 1 || alvo.acoes?.includes(acao))
                item.push(alvo);
        }
    }

    if ((item.length + entidade.length) > 1) {
        if (!(!acao || acoesConfig[acao as AcaoValue].args >= arg)) {
            return { item: undefined, entidade: undefined };
        }

        if (item.length > 0) {
            item = [item[0]];
            entidade = [];
        } else {
            entidade = [entidade[0]];
            item = [];
        }
    }

    return { item: item.at(0), entidade: entidade.at(0) };
};

type ComponenteAtualizavel = { id: string, atualizadoEm: string | Date };
function mudouAlgo(_obj1: undefined | null | ComponenteAtualizavel | ComponenteAtualizavel[], _obj2?: null | ComponenteAtualizavel | ComponenteAtualizavel[]) {
    if(!_obj1 || !_obj2) return true;

    const obj1 = Array.isArray(_obj1) ? _obj1 : [_obj1];
    const obj2 = Array.isArray(_obj2) ? _obj2 : [_obj2];

    if(obj1.length !== obj2.length) return true;

    for(let o1 of obj1) {
        const o2 = obj2.find(o => o.id === o1.id);
        if(!o2) return true;
        if(new Date(o1.atualizadoEm).getTime() !== new Date(o2.atualizadoEm).getTime()) return true;
    }
    return false;
}

export const descreverTudo = (termPrint: (...args: string[]) => void, situacao: RespostaSituacao, situacaoAnterior?: Partial<RespostaSituacao> | null) => {
    const { resposta, sala, jogador } = situacao;

    if(resposta)
    termPrint(cor.resposta(resposta));

    const acoes = new Set<string>();

    let mudouSala = sala.id !== situacaoAnterior?.sala?.id;
    if(mudouSala || sala.descricao !== situacaoAnterior?.sala?.descricao) {
        termPrint(cor.descricao(sala.descricao?.trim() || ""));
    }

    let voceVeAqui = false;
    if(sala.itens && sala.itens.length > 0 && (mudouSala || mudouAlgo(sala.itens, situacaoAnterior?.sala?.itens))) {
        voceVeAqui = true;
        termPrint(cor.texto("Você vê aqui:"));
        for(let item of sala.itens) {
            termPrint(`  ${cor.quantidade(item.quantidade)} ${cor.item(item.descricao?.trim())}`);
            if(item.acoes && item.acoes.length > 0) {
                item.acoes.forEach(a => acoes.add(a));
            }
        }
    }

    const entidades = sala.entidades;
    if(entidades && entidades.length > 0 && (mudouSala || mudouAlgo(entidades, situacaoAnterior?.sala?.entidades))) {
        if(!voceVeAqui) {
            termPrint(cor.texto("Você vê aqui:"));
        }
        for(let entidade of entidades) {
            termPrint(`  ${cor.entidade(entidade.descricao?.trim())}`);
            if(entidade.acoes && entidade.acoes.length > 0) {
                entidade.acoes.forEach(a => acoes.add(a));
            }
            if(entidade.itens && entidade.itens.length > 0) {
                termPrint(cor.texto("  que contém:"));
                for(let item of entidade.itens) {
                    termPrint(`     ${cor.quantidade(item.quantidade)} ${cor.item(item.descricao?.trim() || item.nome)}`);
                    if(item.acoes && item.acoes.length > 0) {
                        item.acoes.forEach(a => acoes.add(a));
                    }
                }
            }
        }
    }
    
    if(mudouAlgo(jogador.itens, situacaoAnterior?.jogador?.itens)) {
        if(jogador.itens && jogador.itens.length > 0) {
            termPrint(cor.texto("Na sua mochila você tem:"));
            for(let item of jogador.itens) {
                termPrint(`  ${cor.quantidade(item.quantidade)} ${cor.item(item.descricao?.trim() || item.nome)}`);
                if(item.acoes && item.acoes.length > 0) {
                    item.acoes.forEach(a => acoes.add(a));
                }
            }
        } else {
            termPrint(cor.texto("Sua mochila está vazia."));
        }
    }
    if(mudouSala && sala.acoes && sala.acoes.length > 0) {
        sala.acoes.forEach(a => acoes.add(a));
    }

    const acoesLista = Array.from(acoes)
        .filter(a => DIRECOES.includes(a as AcaoValue) === false)
        .sort()
        .map(a => cor.acao(a.length > 2 ? a.toLowerCase() : a));

    // Aqui lista ações do que foi descrito apenas
    if(acoesLista.length > 0) {
        termPrint(cor.texto("Ações:"), acoesLista.join(cor.texto(", ")));
    }

    // Agora lista todas as ações de movimento possíveis
    const mapAcoes: Partial<Record<AcaoValue, boolean | undefined>> = {};    
    for(let acao of sala.acoes || []) {
        mapAcoes[acao as AcaoValue] = true;
    }
    for(let item of sala.itens || []) {
        for(let acao of item.acoes || []) {
            mapAcoes[acao as AcaoValue] = true;
        }
    }
    for(let entidade of sala.entidades || []) {
        for(let acao of entidade.acoes || []) {
            mapAcoes[acao as AcaoValue] = true;
        }
        for(let item of entidade.itens || []) {
            for(let acao of item.acoes || []) {
                mapAcoes[acao as AcaoValue] = true;
            }
        }
    }
    for(let item of jogador.itens || []) {
        for(let acao of item.acoes || []) {
            mapAcoes[acao as AcaoValue] = true;
        }
    }
    termPrint(` ${mapAcoes[Acao.NO] ? cor.acao("NO") : "  "} ${mapAcoes[Acao.N] ? cor.acao("N") : " "} ${mapAcoes[Acao.NE] ? cor.acao("NE") : "  "} ${mapAcoes[Acao.Subir] ? cor.acao("subir") : " "}`);
    termPrint(` ${mapAcoes[Acao.O] ? cor.acao("O ") : "  "  } ${cor.resposta("✢")} ${mapAcoes[Acao.L] ? cor.acao(" L") : "  "} ${mapAcoes[Acao.Entrar] ? cor.acao("entrar") : " "}  ${mapAcoes[Acao.Sair] ? cor.acao("sair") : " "}`);
    termPrint(` ${mapAcoes[Acao.SO] ? cor.acao("SO") : "  "} ${mapAcoes[Acao.S] ? cor.acao("S") : " "} ${mapAcoes[Acao.SE] ? cor.acao("SE") : "  "} ${mapAcoes[Acao.Descer] ? cor.acao("descer") : " "}`);

    return {
        resposta,
        jogador,
        sala
    };
}


export class TextoController extends ControllerBase {
    static processarTexto: RequestHandler = async (req, res, next) => {
        const { username } = req.session! as User;
        const body = {
            cores: false,
            comando: "",
        }
        if(req.method === "GET") {
            const parsed = parseRequest(textoDocs["/texto"].post.schema, { body: req.query });
            body.comando = parsed.body.comando || "";
            body.cores = parsed.body.cores || false;
        } else if(req.method === "POST") {
            const parsed = parseRequest(textoDocs["/texto"].post.schema, req);
            body.comando = parsed.body.comando || "";
            body.cores = parsed.body.cores || false;
        }

        let returnStr = "";
        const termPrint = (...args: string[]) => {
            returnStr += args.join("") + "\n";
        };

        const result = await UserRepository.jogoInfo(db, username);
        if (!result || !result.usuario || !result.entidade) {
            throw new RevokeSessionError("BANIDO!");
        }

        const salaId = result.entidade.ondeId;
        if (!salaId) {
            throw new RevokeSessionError("Usuário não está em uma sala válida");
        }

        try {
        const ctx = new Contexto(await Contexto.carregar(username, salaId));
        let situacao = await ctx.retornarSituacao();

        const alvos = CommandParser.buildContext(situacao);
        const parser = new CommandParser(body.comando, { alvos });

        const { acao, quantidade, alvoA: _alvoA, alvoB: _alvoB, resto } = parser.parse();
        
        const alvoA = await desambiguar(acao, alvos, _alvoA, 1);
        const alvoB = await desambiguar(acao, alvos, _alvoB, 2);
        let texto = resto?.toLowerCase().trim() || undefined;

        if (acao && acoesConfig[acao].texto === true && !texto) {
            throw new ParserError(`O comando '${acao.length > 2 ? acao.toLowerCase() : acao}' precisa de um texto. Ex: ${acao.length > 2 ? acao.toLowerCase() : acao} <texto>`);
        }

        const extra = { 
            quantidade: quantidade, 
            item: alvoB.item?.id, 
            entidade: alvoB.entidade?.id, 
            texto: texto || undefined
        };

        console.log("Ação:", acao, "AlvoA:", alvoA, "AlvoB:", alvoB, "Texto:", texto, "Extra:", extra);

        const parar = await ctx.executarAcoesAntes(extra as any);
        if(parar) {
            descreverTudo(termPrint, situacao, undefined);
        } else if (!acao || acao === Acao.Mochila || (!alvoA.entidade && !alvoA.item && acao === Acao.Olhar)) {
            // Apenas olhar ao redor
            if (acao === Acao.Mochila) {
                descreverTudo(termPrint, situacao, { ...situacao, jogador: undefined });
            } else {
                descreverTudo(termPrint, situacao, { ...situacao, sala: undefined });
            }
        } else if (acao === Acao.Ajuda) {
            termPrint(" Ação: Sinônimo1, Sinônimo2, ...");
            for (let acaoKey in acoesConfig) {
                const acao = acaoKey as AcaoValue;
                termPrint(`  ${acao.length > 2 ? acao.toLowerCase() : acao}: ${acoesConfig[acao].sinonimos.join(", ").toLowerCase()}`);
            }
            termPrint("");
            termPrint("Comandos devem seguir uma das seguintes estruturas:");
            termPrint("  <Ação>");
            termPrint("  ir <Direção>");
            termPrint("  <Ação> <Alvo>");
            termPrint("  <Ação> <Quantidade> <Alvo>");
            termPrint("  <Ação> <AlvoA> <AlvoB>");
            termPrint("  <Ação> <AlvoA> <Quantidade> <AlvoB>");
            termPrint("  usando <Alvo> <Ação>");
            termPrint("  usando <AlvoA> <Ação> <AlvoB>");
            termPrint("");
            termPrint("Onde:");
            termPrint("  <Ação>: Uma ação válida (ver lista acima)");
            termPrint("  <Direção>: Uma direção (N, S, L, O, NORTE, SUL, etc)");
            termPrint("  <Alvo>, <AlvoA>, <AlvoB>: Um item ou entidade visível");
            termPrint("  <Quantidade>: Um número (ex: 3)");
            termPrint("");
            termPrint("Artigos, preposições e contrações são ignoradas, como 'o', 'de', 'na', 'numa', etc.");
            termPrint("");
            termPrint("Exemplos:");
            termPrint("  norte");
            termPrint("  abrir porta");
            termPrint("  pegar 1 pedra");
            termPrint("  largar pedra");
            termPrint("  colocar no bau 100 moedas");
            termPrint("Também, a qualquer momento poderá:");
            termPrint("  mochila - para ver o que você está carregando");
            termPrint("  olhar - para olhar ao redor novamente ou olhar algo específico");
            termPrint("  ajuda - para ver esta mensagem novamente");
            //termPrint("  falar - fale com quem está na mesma sala que você");
            //termPrint("  gritar - fale com todos no jogo (globalmente)");
            //termPrint("  chat - para ativar/desativar o chat");
            termPrint("  cores - para ativar/desativar cores");
            termPrint("  logout - para sair do jogo.");
            termPrint("");
        } else if (acao === Acao.Logout) {
            //await fetchClient.logout();
            throw new RevokeSessionError("OK");
        // } else if (acao === Acao.Gritar) {
        //     if (chatAtivo) {
        //         enviarRealtimeMensagem(true, jogador.username!, texto!);
        //         chatCallback(true, jogador.username!, texto!);
        //     } else {
        //         termPrint("Chat desativado. Use o comando 'chat' para ativar novamente.");
        //     }
        // } else if (acao === Acao.Falar) {
        //     if (chatAtivo) {
        //         enviarRealtimeMensagem(false, jogador.username!, texto!);
        //         chatCallback(false, jogador.username!, texto!);
        //     } else {
        //         termPrint("Chat desativado. Use o comando 'chat' para ativar novamente.");
        //     }
        // } else if (acao === Acao.Chat) {
        //     chatAtivo = !chatAtivo;
        //     if (!chatAtivo) {
        //         termPrint("Chat desativado.");
        //         desconectarRealtime();
        //     } else {
        //         termPrint("Chat ativado.");
        //     }
        // } else if (acao === Acao.Cores) {
        //     coresAtivas = !coresAtivas;
        //     if (coresAtivas) {
        //         chalk = getChalk(true);
        //         termPrint(chalk.green("Cores ativadas."));
        //     } else {
        //         chalk = getChalk(false);
        //         termPrint("Cores desativadas.");
        //     }
        } else {
            // Mensagem da ação para outros na mesma sala
            //if (chatAtivo) enviarRealtimeMensagem(false, jogador.username!, parser.rawCommand);

            if (alvoA.item) {
                await ItemController._executarAcao(ctx, extra, { salaId: salaId, id: alvoA.item.id, acao });
            } else if (alvoA.entidade) {
                await EntidadeController._executarAcao(ctx, extra, { salaId: salaId, id: alvoA.entidade.id, acao });
            } else {
                await SalaController._executarAcao(ctx, extra, { salaId: salaId, acao });
            }
            descreverTudo(termPrint, await ctx.retornarSituacao(), situacao);
        }

        } catch (err) {
            if (err instanceof ParserError) {
                termPrint(cor.resposta(err.message));
            } else {
                throw err;
            }
        }

        if(body.cores !== true) {
            // Limpar códigos de cores ANSI se o cliente não quiser
            // https://nodejs.org/api/util.html#utilstripvtcontrolcharactersstr
            returnStr = stripVTControlCharacters(returnStr);
        }

        // Send Plain text response
        res
            .status(200)
            .type("text/plain")
            .send(returnStr);       
    }
}