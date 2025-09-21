import { distance, distance as levenshteinDistance } from 'fastest-levenshtein';
import anyAscii from 'any-ascii';
import { Acao, acoesConfig } from './comandoConfig';

// --- Interfaces para Estruturar os Dados do Jogo ---
type AcaoValue = typeof Acao[keyof typeof Acao];

interface GameContext<T> {
    alvos: Record<string, { sinonimos: string[], ref: T }>;
}

function normalize(text: string): string {
    return anyAscii(text.replaceAll(/[\r\n\t]/g," ")).toUpperCase().trim();
}

const DIRECOES: string[] = [Acao.N, Acao.S, Acao.L, Acao.O, Acao.NE, Acao.NO, Acao.SE, Acao.SO, Acao.Subir, Acao.Descer, Acao.Entrar, Acao.Sair];

const ACOES_QUANTIDADE: string[] = [Acao.Pegar, Acao.Largar, Acao.Colocar, Acao.Dar, Acao.Jogar, Acao.Usar];

export class CommandParser<T> {
    private rawCommand: string;
    private lastArgsi: number;
    private argsi: number;
    private args: string[];
    private context: GameContext<T>;

    private static MATCH_THRESHOLD = 2;

    constructor(command: string, context: GameContext<T>) {
        this.rawCommand = command;
        this.context = context;
        this.args = [];
        this.argsi = 0;
        this.lastArgsi = 0;

        for(const key of Object.keys(this.context.alvos)) {
            this.context.alvos[key].sinonimos = this.context.alvos[key].sinonimos.map(s => normalize(s));
        }
        this.args = this.rawCommand.split(/\s+/).map(p => normalize(p)).filter(p => {
            return p.length > 0
        });
        this.argsi = 0;
    }

    private findBestMatch(term: string, candidates: Record<string, { sinonimos: string[] }>) {
        const keys = Object.keys(candidates);
        const matches: { match: string; confidence: number }[]  = [];

        if (keys.length === 0) return matches;

        if(!term) {
            return keys.map(k => ({ match: k, confidence: 0 }));
        }

        for (const key of keys) {
            let match: string | null = null;
            let minDistance = Infinity;

            const { sinonimos } = candidates[key];
            for(const sinonimo of sinonimos) {
                const distance = levenshteinDistance(term, sinonimo);

                if (distance < minDistance) {
                    minDistance = distance;
                    match = key;
                }
            }

            const threshold = Math.min(CommandParser.MATCH_THRESHOLD, Math.floor(term.length / 2));
            if (match && minDistance <= threshold) {
                const confidence = term.length > 0 ? 1 - (minDistance / term.length) : 0;
                matches.push({ match, confidence: confidence });
            }
        }

        matches.sort((a, b) => b.confidence - a.confidence);

        return matches;
    }

    private proximaPalavra() {
        return this.argsi < this.args.length ? this.args[this.argsi++] : null;
    }

    private extrairComando(palavra?: string | null | undefined) {
        if(!palavra) {
            return [{ match: Acao.Olhar, confidence: 1 }];
        }
        return this.findBestMatch(palavra, acoesConfig);
    }

    private proximoArgumento() {
        this.lastArgsi = this.argsi;
        let palavra: string | null;
        do {
            palavra = this.proximaPalavra();
            if(!palavra) {
                break;
            }
            
            const { match, confidence } = this.findBestMatch(palavra, {
                [Acao.Artigos]: acoesConfig[Acao.Artigos],
                [Acao.Preposicoes]: acoesConfig[Acao.Preposicoes],
                [Acao.Contracoes]: acoesConfig[Acao.Contracoes],
            }).at(0) || { match: null, confidence: 0 };
            
            if(!match) {
                return { confidence: 0, texto: palavra};
            }

            const ehConector = match === Acao.Artigos || match === Acao.Preposicoes || match === Acao.Contracoes;
            if(!ehConector) {
                return { confidence: confidence, texto: palavra };    
            }
        } while (palavra !== null);

        return { confidence: 0, texto: null };
    }

    private proximoComando() {
        this.lastArgsi = this.argsi;
        let palavra: string | null;
        do {
            palavra = this.proximaPalavra();
            const { match, confidence } = this.extrairComando(palavra).at(0) || { match: null };
            
            if(!match) {
                return { acao: null, confidence: 0, texto: palavra};
            }

            const ehConector = match === Acao.Artigos || match === Acao.Preposicoes || match === Acao.Contracoes;
            if(!ehConector) {
                return { acao: match as AcaoValue, confidence: confidence, texto: palavra };    
            }
        } while (palavra !== null);

        return { acao: null, confidence: 0, texto: null };
    }
    
    public parse() {
        let cmd = this.proximoComando();
        if(cmd.acao === Acao.Ir) {
            cmd = this.proximoComando();
            if(!cmd.acao || !DIRECOES.includes(cmd.acao)) {
                throw new Error("Comando 'ir' deve ser seguido por uma direção válida.");
            }
        }

        if(!cmd.acao) {
            const sorteio = Math.floor(Math.random() * 5);
            if(sorteio === 0) throw new Error("Comando desconhecido. Precisa de ajuda? escreva 'ajuda'.");
            if(sorteio === 1) throw new Error("sflhs fsfh sd fjsdhfsdjfsdfsd sdfsdf - Foi isso que entendi");
            if(sorteio === 2) throw new Error("Me desculpe?");
            if(sorteio === 3) throw new Error("Tem certeza que não precisa de ajuda?");
            throw new Error("... ?");
        }

        let acao = cmd.acao as AcaoValue;
        let quantidade: number | undefined = undefined;

        /*if(acoesConfig[acao].args === 0) {
            return { acao, quantidade, alvoA: [], alvoB: [], resto: this.args.slice(this.argsi).join(" ") };
        }*/
        
        let oq = this.proximoArgumento();

        // Pegar 3 pedras
        if(oq.texto && ACOES_QUANTIDADE.includes(acao) && oq.texto.match(/^\d+$/)) {
            quantidade = parseInt(oq.texto);
            if(quantidade <= 0) {
                throw new Error(`A quantidade deve ser maior que zero.`);
            }

            oq = this.proximoArgumento();
        }

        if(!oq.texto) {
            if(acao === Acao.Olhar) {
                return { acao, quantidade, alvoA: [], alvoB: [], resto: this.args.slice(this.lastArgsi).join(" ") };
            } else {
                // Comando que precisa de alvo, mas não tem, pode ser qualquer um
                return { acao, quantidade, alvoA: this.findBestMatch("", this.context.alvos), alvoB: this.findBestMatch("", this.context.alvos), resto: this.args.slice(this.lastArgsi).join(" ") };
            }
        }

        const alvoA = this.findBestMatch(oq.texto, this.context.alvos);
        if(alvoA.length === 0) {
            throw new Error(`Não há nenhum '${oq.texto}' aqui`);
        }
        
        if(acao === Acao.Usar) {
            // usar <obj2> para? <cmd> <obj1>
            // usar papel para escrever
            // usar saco para colocar lanche
            
            const usarAcao = this.proximoComando();
            if(!usarAcao.acao) {
                throw new Error(`Você quer usar ${oq.texto} para fazer o quê?`);
            }

            acao = usarAcao.acao as AcaoValue; 
        }

        let comoq = this.proximoArgumento();
        if(comoq.texto) {
            // Muda o comando pois refere-se a algo
            if(acao === Acao.Largar) {
                acao = Acao.Colocar;
            }

            if(acao === Acao.Mover || acao === Acao.Tocar) {
                acao = Acao.Virar;
            }

            if(acao === Acao.Abrir) {
                acao = Acao.Destrancar;
            }

            if(acao === Acao.Fechar) {
                acao = Acao.Trancar;
            }

            // Colocar no chão vira largar
            if(acao === Acao.Colocar && this.extrairComando(comoq.texto).at(0)?.match === Acao.Chao) {
                acao = Acao.Largar;
                comoq = { confidence: 0, texto: null };
            }

            // Colocar na mochila vira pegar
            if(acao === Acao.Colocar && this.extrairComando(comoq.texto).at(0)?.match === Acao.Mochila) {
                acao = Acao.Pegar;
                comoq = { confidence: 0, texto: null };
            }
        }

        /*if(acoesConfig[acao].args === 1) {
            return { acao, quantidade, alvoA: alvoA, alvoB: [], resto: this.args.slice(this.lastArgsi).join(" ") };
        }*/

        if(!comoq.texto) {
            //throw new Error(`Precisa se referir a algo para ${acao}`);
            // Comando que precisa de dois alvos, mas só tem um, pode ser qualquer um 
            return { acao, quantidade, alvoA: alvoA, alvoB: this.findBestMatch("", this.context.alvos), resto: this.args.slice(this.lastArgsi).join(" ") };
        }

        const alvoB = this.findBestMatch(comoq.texto, this.context.alvos) || { match: null };
        if(alvoB.length === 0) {
            throw new Error(`Não há nenhum '${comoq.texto}' aqui`);
        }

        return { acao, quantidade, alvoA: alvoA, alvoB: alvoB, resto: this.args.slice(this.argsi).join(" ") };
    }
}
