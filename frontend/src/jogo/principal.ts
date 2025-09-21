import anyAscii from "any-ascii";
import { passwordPrompt, prompt, termPrint } from "../terminal";
import { APIError, fetchClient, type RespostaEntidades, type RespostaItens, type RespostaSala, type RespostaSituacao } from "../utils/fetchApi";

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
            if(entidade.itens) {
                termPrint("  que está com:");
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

export const principal = async () => {
    let situacao: RespostaSituacao | null = null;
    while(true) {
        try {
            if(!situacao || !situacao.sala || !situacao.jogador) {
                situacao = descreverTudo(await fetchClient.salaOlhar(), null);
            }

            let { sala, jogador } = situacao;

            const comando = (await prompt(jogador.username+"> ")).trim().toUpperCase();
            let partes = comando.split(" ").map(p => anyAscii(p.replaceAll(/[\r\n\t]/g," ").trim())).filter(p => {
                return p.length > 0
            });

            let acao = partes.length > 0 ? partes[0] : "OLHAR";
            let item: RespostaItens[] = [];
            let entidade: RespostaEntidades[] = [];
            let nome: string | undefined = undefined;
            let quantidade = 1;
            const args = partes.slice(1);
            if(args.length > 0) {
                if(args[0].match(/^\d+$/)) {
                    quantidade = parseInt(args[0]);
                    args.shift();
                }
            }
            if(args.length > 0) {
                nome = args[0];
                args.shift();
            }

            // Mochila
            item = jogador.itens?.filter(i => (i.nome.toUpperCase() === nome || nome === undefined) && i.acoes?.includes(acao)) || [];
            
            // Chão
            item.push(...(sala.itens?.filter(i => (i.nome.toUpperCase() === nome || nome === undefined) && i.acoes?.includes(acao)) || []));

            // Entidades
            for(let ent of sala.entidades || []) {
                // Tipo ou nome do jogador
                if((ent.tipo.toUpperCase() === nome || ent.username?.toUpperCase() === nome || nome === undefined) && ent.acoes?.includes(acao)) {
                    entidade.push(ent);
                }

                // Itens da entidade
                item.push(...(ent.itens?.filter(i => (i.nome.toUpperCase() === nome || nome === undefined) && i.acoes?.includes(acao)) || []));
            }
            

            if(!acao || acao === "OLHAR" || acao === "MOCHILA") {
                // Apenas olhar ao redor
                if(acao === "MOCHILA") {
                    situacao = descreverTudo(await fetchClient.salaOlhar(), { ...situacao, jogador: undefined });
                } else {
                    situacao = descreverTudo(await fetchClient.salaOlhar(), { ...situacao, sala: undefined});
                }
            } else if (acao === "SAIR" || acao === "LOGOUT") {
                await fetchClient.logout();
                termPrint("Até mais!");
                break;
            } else {
                if(item.length > 1) {
                    termPrint("Seja mais específico:");
                    for(let k = 0; k < item.length; k++) {
                        const i = item[k];
                        termPrint(`  ${String.fromCharCode(k + "A".charCodeAt(0))}: ${i.quantidade} ${i.nome} ${i.descricao?.trim() || ""}`);
                    }
                    const escolha = (await prompt("Escolha um: ")).trim();
                    const escolhaNum = escolha.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
                    if(!isNaN(escolhaNum) && escolhaNum >= 0 && escolhaNum < item.length) {
                        item = [item[escolhaNum]];
                    } else {
                        termPrint("Escolha inválida.");
                        continue;
                    }
                }

                if(item.length > 0) {
                    situacao = descreverTudo(await fetchClient.itemAcao(item[0].id, acao, { quantidade, texto: args.slice(1).join(" ") || undefined }), situacao);
                } else if(entidade.length > 0) {
                    termPrint("Ações em entidades ainda não implementadas.");
                    //situacao = descreverTudo(await fetchClient.entidadeAcao(entidade.id, acao, { quantidade, texto: args.slice(1).join(" ") || undefined }), situacao);
                } else {
                    switch(acao) {
                        case "NORTE": acao = "N"; break;
                        case "SUL": acao = "S"; break;
                        case "LESTE": acao = "L"; break;
                        case "OESTE": acao = "O"; break;
                    }

                    situacao = descreverTudo(await fetchClient.salaMover(acao), situacao);
                }
            }

            /*// A FAZER: processar isso melhor kk
            if(!acao || acao === "OLHAR") {
                // Apenas olhar ao redor
                situacao = descreverTudo(await fetchClient.salaOlhar(), { ...situacao, sala: undefined});
            } else if (acao === "MOCHILA") {
                let _situacao = situacao;
                situacao = await fetchClient.salaOlhar();
                descreverTudo(situacao, { ..._situacao, jogador: { ..._situacao.jogador, itens: null } });
            } else if (acao === "SAIR") {
                await fetchClient.logout();
                termPrint("Até mais!");
                break;
            } else if (acao === "PEGAR") {
                let quantidade = 1;
                if(args[0].match(/^\d+$/)) {
                    quantidade = parseInt(args[0]);
                    args.shift();
                }
                const itemId = sala.itens?.find(i => i.nome.toUpperCase() === args[0])?.id;
                if(!itemId) {
                    termPrint("Não tem isso aqui.");
                    continue;
                }

                situacao = descreverTudo(await fetchClient.itemAcao(itemId, "PEGAR", { quantidade }), situacao);
            } else if(acao === "LARGAR") {
                let quantidade = 1;
                if(args[0].match(/^\d+$/)) {
                    quantidade = parseInt(args[0]);
                    args.shift();
                }
                const itemId = jogador.itens?.find(i => i.nome.toUpperCase() === args[0])?.id;
                if(!itemId) {
                    termPrint("Você não tem isso.");
                    continue;
                }

                situacao = descreverTudo(await fetchClient.itemAcao(itemId, "LARGAR", { quantidade }), situacao);
            } else if (acao === "ESCREVER" || acao === "LER") { // Melhorar isso...
                let itemId = jogador.itens?.find(i => i.nome.toUpperCase() === args[0])?.id;
                if(!itemId) {
                    itemId = sala.itens?.find(i => i.nome.toUpperCase() === args[0])?.id;
                    if(!itemId) {
                        termPrint("Não tem isso aqui e nem você.");
                        continue;
                    }
                }

                if(acao === "ESCREVER") {
                    const texto = args.slice(1).join(" ") || "";
                    situacao = descreverTudo(await fetchClient.itemAcao(itemId, acao, { texto }), situacao);
                } else {
                    situacao = descreverTudo(await fetchClient.itemAcao(itemId, acao), situacao);
                }
            } else {
                switch(acao) {
                    case "NORTE": acao = "N"; break;
                    case "SUL": acao = "S"; break;
                    case "LESTE": acao = "L"; break;
                    case "OESTE": acao = "O"; break;
                }

                situacao = descreverTudo(await fetchClient.salaMover(acao), situacao);
            }*/
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