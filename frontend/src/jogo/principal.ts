import anyAscii from "any-ascii";
import { passwordPrompt, prompt, termPrint } from "../terminal";
import { APIError, fetchClient, type RespostaEntidades, type RespostaItens, type RespostaSala, type RespostaSituacao } from "../utils/fetchApi";
import { CommandParser } from "../utils/commandParser";
import { Acao } from "../utils/comandoConfig";

type ComponenteAtualizavel = { id: string, atualizadoEm: string };
function mudouAlgo(_obj1: undefined | null | ComponenteAtualizavel | ComponenteAtualizavel[], _obj2?: null | ComponenteAtualizavel | ComponenteAtualizavel[]) {
    if(!_obj1 || !_obj2) return true;

    const obj1 = Array.isArray(_obj1) ? _obj1 : [_obj1];
    const obj2 = Array.isArray(_obj2) ? _obj2 : [_obj2];

    if(obj1.length !== obj2.length) return true;

    for(let o1 of obj1) {
        const o2 = obj2.find(o => o.id === o1.id);
        if(!o2) return true;
        if(o1.atualizadoEm !== o2.atualizadoEm) return true;
    }
    return false;
}

function descreverTudo(situacao: RespostaSituacao, situacaoAnterior?: Partial<RespostaSituacao> | null) {
    const { resposta, sala, jogador } = situacao;

    termPrint(resposta);

    let mudouSala = sala.id !== situacaoAnterior?.sala?.id;
    if(mudouSala || sala.descricao !== situacaoAnterior?.sala?.descricao) {
        termPrint(sala.descricao?.trim() || "");
    }

    if(sala.itens && sala.itens.length > 0 && (mudouSala || mudouAlgo(sala.itens, situacaoAnterior?.sala?.itens))) {
        termPrint("Você vê aqui:");
        for(let item of sala.itens) {
            termPrint(`  ${item.quantidade} ${item.descricao?.trim()}`);
            if(item.acoes && item.acoes.length > 0) {
                termPrint(`    (${item.acoes.join(", ")})`);
            }
        }
    }

    const entidades = sala.entidades;
    if(entidades && entidades.length > 0 && (mudouSala || mudouAlgo(entidades, situacaoAnterior?.sala?.entidades))) {
        termPrint("está aqui:");
        for(let entidade of entidades) {
            termPrint(`  ${entidade.descricao?.trim()}`);
            if(entidade.acoes && entidade.acoes.length > 0) {
                termPrint(`    (${entidade.acoes.join(", ")})`);
            }
            if(entidade.itens && entidade.itens.length > 0) {
                termPrint("  que contém:");
                for(let item of entidade.itens) {
                    termPrint(`     ${item.quantidade} ${item.descricao?.trim() || item.nome}`);
                    if(item.acoes && item.acoes.length > 0) {
                        termPrint(`    (${item.acoes.join(", ")})`);
                    }
                }
            }
        }
    }
    
    if(mudouAlgo(jogador.itens, situacaoAnterior?.jogador?.itens)) {
        if(jogador.itens && jogador.itens.length > 0) {
            termPrint("Na sua mochila você tem:");
            for(let item of jogador.itens) {
                termPrint(`  ${item.quantidade} ${item.descricao?.trim() || item.nome}`);
                if(item.acoes && item.acoes.length > 0) {
                    termPrint(`    (${item.acoes.join(", ")})`);
                }
            }
        } else {
            termPrint("Sua mochila está vazia.");
        }
    }

    if(mudouSala) {
        if(sala.acoes && sala.acoes.length > 0) {
            termPrint("ações:");
            for(let conexao of sala.acoes) {
                termPrint(`  ${conexao}`);
            }
        }
    }

    return {
        resposta,
        jogador,
        sala
    };
}

const fazerLogin = async () => {
    while(true) {
        // Fazer login vs cadastrar
        let login = false;
        const acao = (await prompt("Você já possui uma conta? (S/N) ")).trim().toUpperCase();
        if(acao === "S" || acao === "SIM") {
            login = true;
        } else {
            termPrint("Ok, vamos criar uma nova conta.");
        }

        const username = (await prompt("Usuário: ")).trim();
        const password = (await passwordPrompt("Senha: ")).trim();

        try {
            if(login)
            await fetchClient.login(username, password);
            else
            await fetchClient.cadastrar(username, password);

            termPrint("Login realizado com sucesso!");
            return;
        } catch(err) {
            if(err instanceof APIError && (err.status === 401 || err.status === 400)) {
                termPrint(err.message);
                termPrint("\nTente novamente.");
                continue;
            }

            console.error(err);
            termPrint("Erro:", err?.toString());
        }
    }
}

export const desambiguar = async (acao: string, alvos: Record<string, { sinonimos: string[], ref: RespostaItens | RespostaEntidades }>, alvosMatch: {match: string, confidence: number}[]) => {
    let item: RespostaItens[] = [];
    let entidade: RespostaEntidades[] = [];
    for(let result of alvosMatch) {
        const alvo = alvos[result.match]?.ref;
        if("tipo" in alvo) {
            if(alvo.acoes?.includes(acao))
            entidade.push(alvo);
        } else {
            if(alvo.acoes?.includes(acao))
            item.push(alvo as RespostaItens);
        }
    }

    if(item.length + entidade.length > 1) {
        termPrint("Seja mais específico:");
        let k = 0;
        for(; k < item.length; k++) {
            const i = item[k];
            termPrint(`  ${String.fromCharCode(k + "A".charCodeAt(0))}: ${i.quantidade} ${i.nome} ${i.descricao?.trim() || ""}`);
        }
        for(; k < entidade.length; k++) {
            const e = entidade[k];
            termPrint(`  ${String.fromCharCode(k + "A".charCodeAt(0))}: ${e.tipo} ${e.descricao?.trim() || ""}`);
        }
        const escolha = (await prompt("Escolha um: ")).trim();
        const escolhaNum = escolha.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
        if(isNaN(escolhaNum) || escolhaNum < 0) {
            termPrint("Escolha inválida.");
            return {item: undefined, entidade: undefined };
        }

        if(escolhaNum < item.length) {
            item = [item[escolhaNum]];
            entidade = [];
        } else if (escolhaNum - item.length < entidade.length) {
            entidade = [entidade[escolhaNum - item.length]];
            item = [];
        } else {
            termPrint("Escolha inválida.");
            return {item: undefined, entidade: undefined };
        }
    }

    return { item: item.at(0), entidade: entidade.at(0) };
}

export const principal = async () => {
    let situacao: RespostaSituacao | null = null;
    while(true) {
        try {
            if(!situacao || !situacao.sala || !situacao.jogador) {
                situacao = descreverTudo(await fetchClient.salaOlhar(), null);
            }

            let { sala, jogador } = situacao;

            const alvos: Record<string, { sinonimos: string[], ref: RespostaItens | RespostaEntidades }> = {};
            
            for(let item of jogador.itens || []) {
                alvos[item.id] = { sinonimos: [item.nome], ref: item };
            }
            for(let item of sala.itens || []) {
                alvos[item.id] = { sinonimos: [item.nome], ref: item };
            }
            for(let ent of sala.entidades || []) {
                alvos[ent.id] = { sinonimos: [ent.tipo], ref: ent };
                if(ent.username) {
                    alvos[ent.id].sinonimos.push(ent.username);
                }
                
                for(let item of ent.itens || []) {
                    alvos[item.id] = { sinonimos: [item.nome], ref: item };
                }
            }
            
            const parser = new CommandParser(await prompt(jogador.username+"> "), { alvos });
            const { acao, quantidade, alvoA: _alvoA, alvoB: _alvoB, resto } = parser.parse();

            console.log(alvos, _alvoA, _alvoB);
                      
            const alvoA = await desambiguar(acao, alvos, _alvoA);
            const alvoB = await desambiguar(acao, alvos, _alvoB);

            if(!acao || acao === Acao.Olhar || acao === Acao.Mochila) {
                // Apenas olhar ao redor
                if(acao === Acao.Mochila) {
                    situacao = descreverTudo(await fetchClient.salaOlhar(), { ...situacao, jogador: undefined });
                } else {
                    situacao = descreverTudo(await fetchClient.salaOlhar(), { ...situacao, sala: undefined});
                }
            } else if (acao === Acao.Sair) {
                await fetchClient.logout();
                termPrint("Até mais!");
                break;
            } else {
                console.log(acao, quantidade, alvoA, alvoB, resto);
                if(alvoA.item) {
                    situacao = descreverTudo(await fetchClient.itemAcao(alvoA.item.id, acao, { quantidade, item: alvoB.item?.id, entidade: alvoB.entidade?.id, texto: resto || undefined }), situacao);
                } else if(alvoA.entidade) {
                    situacao = descreverTudo(await fetchClient.entidadeAcao(alvoA.entidade.id, acao, { quantidade, item: alvoB.item?.id, entidade: alvoB.entidade?.id, texto: resto || undefined }), situacao);
                } else {
                    situacao = descreverTudo(await fetchClient.salaMover(acao, { quantidade, item: alvoB.item?.id, entidade: alvoB.entidade?.id, texto: resto || undefined }), situacao);
                }
            }

        } catch(err) {
            if(err instanceof APIError && err.status === 401) {
                termPrint("Você precisa fazer login.");
                await fazerLogin();
                continue;
            }

            console.error(err);
            termPrint("Erro:", err?.toString());

            // Pergunta se quer tentar novamente
            const tentarNovamente = (await prompt("\nQuer continuar? (S/N) ")).trim().toUpperCase();
            if(tentarNovamente !== "S" && tentarNovamente !== "SIM") {
                break;
            }
        }
    }
};