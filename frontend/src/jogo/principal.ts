import { prompt, termPrint } from "../terminal";
import { fetchClient, type RespostaSala } from "../utils/fetchApi";

async function descreverSala() {
    const { resposta, sala, jogador } = await fetchClient.salaOlhar();

    termPrint(resposta);
    termPrint(sala.descricao.trim());
    if(sala.itens && sala.itens.length > 0) {
        termPrint("Você vê aqui:");
        for(let item of sala.itens) {
            termPrint(`${item.quantidade} ${item.descricao.trim()}`);
        }
    }

    if(sala.conexoes && sala.conexoes.length > 0)
    for(let conexao of sala.conexoes) {
        termPrint(`- ${conexao}`);
    }

    return { sala, jogador };
}

export const principal = async () => {
    let jogador: { id: string; salaId: string } | null = null;
    let sala: RespostaSala | null = null;
    while(true) {
        try {
            if(!jogador || !sala || jogador.salaId !== sala.id) {
                const { sala: _sala, jogador: _jogador } = await descreverSala();
                jogador = _jogador;
                sala = _sala;
            }

            const comando = (await prompt("> ")).trim().toUpperCase();
            let partes = comando.split(" ").filter(p => p.trim().length > 0);

            const acao = partes.length > 0 ? partes[0] : undefined;
            const args = partes.slice(1);

            // A FAZER: processar isso melhor kk
            if(!acao || acao === "OLHAR") {
                // Apenas olhar ao redor
                const { sala: _sala, jogador: _jogador } = await descreverSala();
                jogador = _jogador;
                sala = _sala;
            } else if(acao === "PEGAR") {
                const itemId = sala.itens?.find(i => i.tipo.toUpperCase() === args[0])?.id;
                if(!itemId) {
                    termPrint("Não tem isso aqui.");
                    continue;
                }

                const { resposta, jogador: _jogador } = await fetchClient.itemPegar(itemId!);
                jogador = _jogador;

                termPrint(resposta);
            } else if(acao === "LARGAR") {
                const { resposta, jogador: _jogador } = await fetchClient.itemLargar(args[0]);
                jogador = _jogador;

                termPrint(resposta);
            } else {
                const { resposta, jogador: _jogador } = await fetchClient.salaMover(acao);
                jogador = _jogador;

                termPrint(resposta);
            }
        } catch(err) {
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