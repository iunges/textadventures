import { console, prompt } from "../mockConsole";

// troca de function para classe
export class JogoZafiir {
    constructor() {
        // variaveis agora sao propriedades da classe
        this.localizacaoAtual = "Sede";
        this.inventario = [];
        this.jogoAtivo = true;
        this.vidaJogador = 100;
        this.vidaZafiir = 120;

        this.objetos = [
            { nome: "Risty", descricao: "Cartão com o logo 'R.I.S.T.Y.'", posicao: "EquipamentosRisty" },
            { nome: "Zafiir", descricao: "Cartão com o logo 'Za'fiir'", posicao: "Dormitório" },
        ];

        // mapa usa funcao de seta pra verificar o inventario com this.
        this.mapa = {
            Sede: {
                descricao: () => `A luz fria de um monitor solitário te arranca da inconsciência.
                Você está deitado no chão de um ambiente estéril, que vibra com o zumbido baixo de máquinas.
                Painéis de metal e equipamentos de alta tecnologia não deixam dúvida: isto é um laboratório...
                e parece ser secreto. Muito secreto.`,
                conexoes: () => ({ L: () => "Refeitório", O: () => "Dormitório", N: () => "ExperimentosRisty", S: () => "ProjetoZaFiir" }),
            },
            Refeitório: {
                descricao: () => `O cenário é de puro caos. Mesas e cadeiras viradas, comida espalhada e pratos quebrados cobrem o chão.`,
                conexoes: () => ({ O: () => "Sede" }),
            },
            Dormitório: {
                descricao: () => `A desordem aqui é pessoal. Em meio à bagunça, sobre uma pequena escrivaninha, algo chama sua atenção: um cartão de acesso com o logo 'Zafiir'.`,
                conexoes: () => ({ L: () => "Sede" }),
            },
            ExperimentosRisty: {
                descricao: () => `As portas automáticas se abrem com um chiado. O ar tem um cheiro químico e antisséptico.`,
                conexoes: () => ({ L: () => "TanqueXLH2", O: () => "EquipamentosRisty", N: () => "CasulosLH3", S: () => "Sede" }),
            },
            TanqueXLH2: {
                descricao: () => `A sala é dominada por enormes tanques de vidro cheios de um líquido âmbar borbulhante.`,
                conexoes: () => ({ O: () => "ExperimentosRisty" }),
            },
            EquipamentosRisty: {
                descricao: () => `Esta sala é um arsenal. Ao fundo você encontra um cartão com o logo 'Risty'.`,
                conexoes: () => ({ L: () => "ExperimentosRisty", N: () => "CasulosLH3" }),
            },
            CasulosLH3: {
                descricao: () => `Incubadoras orgânicas emitem bipes lentos. À sua direita (Leste), há uma porta trancada.`,
                conexoes: () => ({
                    // verificar item agora usa this.inventario
                    // Operador ternario(mini if else)
                    L: () => this.inventario.includes("Risty") 
                        ? "CentroDePesquisa" 
                        : (console.log("\n>> A porta exige o cartão 'Risty'."), null),
                    O: () => "EquipamentosRisty",
                    S: () => "ExperimentosRisty",
                }),
            },
            CentroDePesquisa: {
                descricao: () => `Dezenas de monitores piscam. Você percebe uma corrente de ar vindo de trás de um rack de servidores.`,
                conexoes: () => ({ O: () => "CasulosLH3", N: () => "PassagemSecreta" }),
            },
            PassagemSecreta: {
                descricao: () => `A passagem leva a um beco sem saída com um teclado numérico. Ao lado está escrito: S1426.`,
                conexoes: () => ({
                    O: () => "CentroDePesquisa",
                    S1426: () => {
                        console.log("\n>> Você digita o código 'S1426'. A porta desliza.");
                        return "CriaturaZaFiir";
                    },
                }),
            },
            ProjetoZaFiir: {
                descricao: () => `O epicentro da pesquisa. Um grande cilindro de vidro estilhaçado sugere que o 'projeto' fugiu.`,
                conexoes: () => ({ L: () => "Depósito", O: () => "NúcleoDeExperimentos", N: () => "Sede" }),
            },
            Depósito: {
                descricao: () => `Poeira e ozônio. Prateleiras de metal se estendem até o teto.`,
                conexoes: () => ({ O: () => "ProjetoZaFiir" }),
            },
            NúcleoDeExperimentos: {
                descricao: () => `O ar aqui é gelado. Cabos grossos correm pelo chão até um terminal vermelho.`,
                conexoes: () => ({ L: () => "ProjetoZaFiir", S: () => "ProjetoSecreto" }),
            },
            ProjetoSecreto: {
                descricao: () => `Uma área limpa e restrita. Uma porta de aço reforçada ao norte bloqueia o caminho.`,
                conexoes: () => ({
                    // Operador ternario(mini if else)
                    N: () => this.inventario.includes("Zafiir") 
                        ? "CriaturaZaFiir" 
                        : (console.log("\n>> A porta exige o cartão 'Zafiir'."), null),
                    S: () => "NúcleoDeExperimentos",
                }),
            },
            CriaturaZaFiir: {
                descricao: () => `Ao abrir a porta, um som gutural congela seu sangue. A criatura 'Za'fiir' te observa!`,
                conexoes: () => ({}),
            },
        };
    }

    // Função auxiliar para o efeito de suspense do Easter Egg
    async esperar(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // O loop principal agora e metodo da classe
    async iniciar() {
        console.log("----------------------------------------------------");
        console.log(this.mapa[this.localizacaoAtual].descricao());

        while (this.jogoAtivo) {
            // operador ternario
            this.localizacaoAtual === "CriaturaZaFiir" 
                ? (await this.iniciarDuelo(), this.jogoAtivo = false) 
                : await this.processarTurno();
        }
    }

    // nova leitura de imput
    async processarTurno() {
        this.exibirOpcoes();
        const comando = await prompt("\n> ");
        const comandoLimpo = comando.toLowerCase().trim();
        const [acao, ...args] = comandoLimpo.split(" ");
        const alvo = args.join(" ");

        // Easter Egg: Instakill com suspense
        if (comandoLimpo === "pensa em acidente de moto") {
            console.log("\n[!] O TEMPO PARECE PARAR...");
            await this.esperar(1000);
            console.log(">> Você sussurra: 'Pensa em acidente de moto...'");
            await this.esperar(1500);
            console.log(">> Za'fiir paralisa... o cérebro dele entra em curto-circuito.");
            await this.esperar(1200);
            console.log(">> A criatura engasga com o próprio pensamento e desmorona.");
            console.log("\n=========================================");
            console.log("   VITÓRIA: ZA'FIIR MORREU ENGASGADO!   ");
            console.log("=========================================\n");
            this.vidaZafiir = 0;
            this.jogoAtivo = false;
            return;
        }

        // Uso de switch case no lugar de if else
        switch (acao) {
            case "pegar":
                this.tentarPegarItem(alvo);
                break;
            case "inventario":
            case "inv":
                this.exibirInventario();
                break;
            case "n": case "s": case "l": case "o":
                this.mover(acao.toUpperCase());
                break;
            default:
                //tuUpperCase
                this.mover(comando.toUpperCase());
        }
    }

    // listagem de comandos disponiveis
    exibirOpcoes() {
        console.log("\n--- Comandos ---");
        const itensAqui = this.objetos.filter(obj => obj.posicao === this.localizacaoAtual);
        itensAqui.forEach(item => console.log(`- pegar ${item.nome.toLowerCase()}`));

        const conexoes = this.mapa[this.localizacaoAtual].conexoes();
        for (const dir in conexoes) {
            if (dir.length === 1) console.log(`- ir para ${dir}`);
        }
        console.log("- inventario");
    }

    // logica de movimento
    mover(direcaoOuCodigo) {
        const conexoes = this.mapa[this.localizacaoAtual].conexoes();
        const destinoFunc = conexoes[direcaoOuCodigo];

        // operador ternario(mini if else)
        destinoFunc 
            ? (() => { 
                const proximo = destinoFunc(); 
                proximo ? (this.localizacaoAtual = proximo, console.log("\n" + "=".repeat(50)), console.log(this.mapa[this.localizacaoAtual].descricao())) : null 
              })()
            : console.log("\n>> Você não pode ir por aí ou o código está errado.");
    }

    // logica de inventario
    tentarPegarItem(nomeItem) {
        const item = this.objetos.find(obj => obj.posicao === this.localizacaoAtual && obj.nome.toLowerCase() === nomeItem);
        // operador ternario(mini if else)
        item 
            ? (item.posicao = "inventario", this.inventario.push(item.nome), console.log(`\n>> Você pegou: ${item.nome}.`))
            : console.log("\n>> Não há esse item aqui.");
    }

    // metodo pra exibir o inventario
    exibirInventario() {
        console.log("\n--- Seu Inventário ---");
        // operador ternario(mini if else)
        this.inventario.length === 0 
            ? console.log("Vazio.") 
            : this.inventario.forEach(i => console.log(`- ${i}`));
    }

    // metodo de duelo e troca pra switch case no lugar de if else
    async iniciarDuelo() {
        if (this.vidaZafiir <= 0) return;

        console.log("\n!!! COMBATE INICIADO !!!");
        
        while (this.vidaJogador > 0 && this.vidaZafiir > 0) {
            console.log(`\nSua Vida: ${this.vidaJogador} | Vida Za'fiir: ${this.vidaZafiir}`);
            const entrada = await prompt("Ação [atacar, defender, esquivar]: ");
            const acao = entrada.toLowerCase().trim();

            // Easter egg direto no combate
            if (acao === "pensa em acidente de moto") {
                console.log("\n>> Você sussurra a frase proibida...");
                await this.esperar(1000);
                console.log(">> Za'fiir entra em choque anafilático mental e morre engasgado.");
                this.vidaZafiir = 0;
                break;
            }

            const acaoBoss = Math.random() > 0.5 ? "atacar" : "defender";
            const dano = Math.floor(Math.random() * 15) + 10;
            console.log("----------------------------------------");
            
            switch (acao) {
                case "atacar":
                    acaoBoss === "atacar" 
                        ? (console.log(">> Ambos atacam!"), this.vidaJogador -= dano, this.vidaZafiir -= dano)
                        : console.log(">> Você ataca, mas Za'fiir se defende!");
                    break;
                case "defender":
                    acaoBoss === "atacar"
                        ? (console.log(">> Você se defendeu do golpe!"), this.vidaJogador -= Math.floor(dano / 2))
                        : console.log(">> Ambos em postura defensiva.");
                    break;
                case "esquivar":
                    acaoBoss === "atacar"
                        ? (Math.random() > 0.4 
                            ? (console.log(">> Esquiva e contra-ataque!"), this.vidaZafiir -= (dano + 5))
                            : (console.log(">> Falha na esquiva!"), this.vidaJogador -= (dano + 10)))
                        : console.log(">> Você esquiva, mas ele não atacou.");
                    break;
                default:
                    console.log(">> Você hesitou e Za'fiir te golpeou!");
                    this.vidaJogador -= dano;
            }
        }

        this.vidaJogador > 0 
            ? console.log("\nVITÓRIA! A criatura jaz imóvel no chão.") 
            : console.log("\nDERROTA... A escuridão te consome.");
        
        this.jogoAtivo = false;
    }
}

//funcao pro jogo ainda rodar(function)
export async function zafiir() {
    const jogo = new JogoZafiir();
    await jogo.iniciar();
}