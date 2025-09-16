import { passwordPrompt, prompt, termPrint } from "../terminal";
import { APIError, fetchClient, type RespostaEntidades, type RespostaItens, type RespostaSala } from "../utils/fetchApi";

async function descreverSala(mochila: boolean = false) {
    const { resposta, sala, jogador } = await fetchClient.salaOlhar();

    termPrint(resposta);

    if(mochila) {
        if(jogador.mochila && jogador.mochila.length > 0) {
            termPrint("Na sua mochila você tem:");
            for(let item of jogador.mochila) {
                termPrint(`${item.quantidade} ${item.descricao?.trim() || item.tipo}`);
            }
        } else {
            termPrint("Sua mochila está vazia.");
        }
    } else {
        termPrint(sala.descricao.trim());
        if(sala.itens && sala.itens.length > 0) {
            termPrint("Você vê aqui:");
            for(let item of sala.itens) {
                termPrint(`${item.quantidade} ${item.descricao?.trim()}`);
            }
        }
        const entidades = sala.entidades?.filter(e => 
            (e.tipo !== "JOGADOR" || (Date.now() - new Date(e.atualizadoEm).getTime() <= 1000 * 60 * 10)) 
            && e.username !== jogador.username
        ) || [];
        if(entidades && entidades.length > 0) {
            termPrint("está aqui:");
            for(let entidade of entidades) {
                if(entidade.id !== jogador.username) {
                    termPrint(`- ${entidade.tipo === "JOGADOR" ? entidade.username : entidade.tipo} ${entidade.descricao?.trim()}`);
                }
            }
        }

        if(sala.conexoes && sala.conexoes.length > 0) {
            termPrint("conexões:");
            for(let conexao of sala.conexoes) {
                termPrint(`- ${conexao}`);
            }
        } else {
            termPrint("não há nenhuma direção para ir daqui.");
        }
    }

    return { sala, jogador };
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
    let jogador: { username: string; salaId: string, mochila?: Omit<RespostaItens, "descricao">[] | null  } | null = null;
    let sala: { 
        id: string; 
        itens?: Omit<RespostaItens, "descricao">[] | null; 
        entidades?: Omit<RespostaEntidades, "descricao">[] | null;
    } | null = null;
    while(true) {
        try {
            if(!jogador || !sala || jogador.salaId !== sala.id) {
                const { sala: _sala, jogador: _jogador } = await descreverSala();
                jogador = _jogador;
                sala = _sala;
            }

            const comando = (await prompt(jogador.username+"> ")).trim().toUpperCase();
            let partes = comando.split(" ").filter(p => p.trim().length > 0);

            const acao = partes.length > 0 ? partes[0] : undefined;
            const args = partes.slice(1);

            // A FAZER: processar isso melhor kk
            if(!acao || acao === "OLHAR" || acao === "MOCHILA") {
                // Apenas olhar ao redor
                const { sala: _sala, jogador: _jogador } = await descreverSala(acao === "MOCHILA");
                jogador = _jogador;
                sala = _sala;
            } else if (acao === "SAIR") {
                await fetchClient.logout();
                termPrint("Até mais!");
                break;
            } else if (acao === "PEGAR") {
                const itemId = sala.itens?.find(i => i.tipo.toUpperCase() === args[0])?.id;
                if(!itemId) {
                    termPrint("Não tem isso aqui.");
                    continue;
                }

                const { resposta, sala: _sala, jogador: _jogador } = await fetchClient.itemPegar(itemId);
                jogador = {...jogador, ..._jogador};
                sala = {...sala, ..._sala};

                termPrint(resposta);
            } else if(acao === "LARGAR") {
                const itemId = jogador.mochila?.find(i => i.tipo.toUpperCase() === args[0])?.id;
                if(!itemId) {
                    termPrint("Não tem isso aqui.");
                    continue;
                }

                const { resposta, sala: _sala, jogador: _jogador } = await fetchClient.itemLargar(itemId);
                jogador = {...jogador, ..._jogador};
                sala = {...sala, ..._sala};

                termPrint(resposta);
            } else {
                const { resposta, sala: _sala, jogador: _jogador } = await fetchClient.salaMover(acao);
                jogador = {...jogador, ..._jogador};
                sala = {...sala, ..._sala};

                termPrint(resposta);
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