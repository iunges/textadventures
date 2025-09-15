// Contexto do jogo a ser usado nas funções das salas e comandos
import { db } from "../db/drizzle.ts";
import { type Entidade } from "../db/entidadeSchema.ts";
import { type Estado } from "../db/estadoSchema.ts";
import { type Item } from "../db/itemSchema.ts";
import { type Sala } from "../db/salaSchema.ts";
import { EntidadeRepository } from "../repositories/entidadeRepository.ts";
import { ItemRepository } from "../repositories/itemRepository.ts";
import { SalaRepository } from "../repositories/salaRepository.ts";
import { getItemConfig } from "./itens/itens.ts";
import { getSalaConfig } from "./salas/salas.ts";

export type ItemType = {
    descricao: (ctx: Contexto) => undefined | string | Promise<string | undefined>;
};

export type SalaType = {
    descricao: (ctx: Contexto) => undefined | string | Promise<string | undefined>;
    conexoes: { 
        [direcao: string]: (ctx: Contexto) => undefined | string | Promise<string | undefined>;
    };
    itensIniciais?: {
        tipo: string;
        quantidade: number;
        estadoInicial?: Estado;
    }[];
    estadoInicial?: Estado;
};

// Serve como service que interage com o banco de dados, e guarda o estado atual do jogo
export class Contexto {
    jogador: Entidade;
    private _salvarJogador: boolean = false;

    mochila: Item[] | null = null;
    async getMochila() {
        if(this.mochila) return this.mochila;

        this.mochila = await ItemRepository.naMochila(db, this.jogador.id);
        return this.mochila;
    }

    itensNoChao: Item[] | null = null;
    async getItensNoChao() {
        if(this.itensNoChao) return this.itensNoChao;

        const sala = await this.getSala();
        this.itensNoChao = await ItemRepository.noChao(db, sala.id);
        return this.itensNoChao;
    }

    global: Sala;
    private _salvarGlobal: boolean = false;

    sala: Sala | null;
    private _salvarSala: boolean = false;
    async getSala() {
        if(this.sala) return this.sala;
        
        this.sala = await SalaRepository.getSalaById(db, this.jogador.salaId);
        if (!this.sala) {
            throw new Error("Sala para onde o jogador tentou ir não existe!");
        }

        return this.sala;
    }

    private str: string;

    constructor({ jogador, sala, global, itensNoChao }: {
        jogador: Entidade,
        sala: Sala | null,
        global: Sala,
        itensNoChao: Item[] | null
    }) {
        this.jogador = jogador;
        this.global = global;
        this.sala = sala;
        this.str = "";
        this.itensNoChao = itensNoChao;
    }

    static async carregar(usuarioId: string): Promise<Contexto> {
        const result = await SalaRepository.dadosIniciaisJogador(db, usuarioId);
        return new Contexto(result);
    }

    retornarSituacao() {
        return {
            resposta: this.obterTexto(),
            jogador: {
                id: this.jogador.id,
                salaId: this.jogador.salaId,
            }
        };
    }

    // =========================================================================
    //                 Funções que alteram o estado do jogo  
    // =========================================================================
    moverParaSala(novaSalaId: string) {
        this.jogador.salaId = novaSalaId;
        this._salvarJogador = true;

        if(this.sala && this._salvarSala) {
            throw new Error("Deve salvar antes!");
        }
        this.sala = null; // Forçar recarregar a sala
        this._salvarSala = false;
    }

    async moverItem(item: Item, onde: { entidadeId?: string } | { salaId?: string } | { itemContainerId?: string }) {
        await ItemRepository.moverItem(db, item.id, onde);

        this.mochila = null;
        this.itensNoChao = null;
    }

    async salvar() {
        if(this._salvarJogador) {
            await EntidadeRepository.atualizar(db, this.jogador.id, { 
                salaId: this.jogador.salaId,
                estado: this.jogador.estado
            });
            this._salvarJogador = false;
        }

        if(this._salvarSala && this.sala) {
            await SalaRepository.atualizar(db, this.sala.id, { estado: this.sala.estado });
            this._salvarSala = false;
        }

        if(this._salvarGlobal) {
            await SalaRepository.atualizar(db, this.global.id, { estado: this.global.estado });
            this._salvarGlobal = false;
        }
    }

    // =========================================================================
    //                 Funções para escrever na resposta  
    // =========================================================================
    static async _descricaoItens(ctx: Contexto, itens: Item[]) {
        const descricaoItens = [];
        for(let item of itens) {
            const itemConfig = getItemConfig(item.tipo);
            const descr = await itemConfig.descricao(ctx);
            if(descr) {
                ctx.escrevaln(descr);
            }
            descricaoItens.push({
                id: item.id,
                tipo: item.tipo,
                quantidade: item.quantidade,
                descricao: ctx.obterTexto(),
            });
        }
    }

    async descricaoSala() {
        let salaConfig = getSalaConfig(this.jogador.salaId);

        const descr = await salaConfig.descricao(this);
        if(descr) {
            this.escrevaln(descr);
        }
        const descricaoSala = this.obterTexto();

        const descricaoItens = await Contexto._descricaoItens(this, await this.getItensNoChao());
        const conexoes = Object.keys(salaConfig.conexoes);
        
        return {
            id: this.jogador.salaId,
            descricao: descricaoSala, 
            itens: descricaoItens, 
            conexoes
        };
    }

    escrevaln(...str: unknown[]) {
        this.escreva(...str, "\n");
    }

    escreva(...str: unknown[]) {
        let lastWasString = false;
        for(let s of str) {
            if(s === undefined || s === null) continue;
            let strValue: string;
            let isString: boolean = false;
            if(typeof s === "string") {
                strValue = s;
                isString = true;
            } else if(typeof s === "object") {
                strValue = JSON.stringify(s, null, 2);
            } else {
                strValue = String(s);
            }
            
            this.str += strValue;
            if(lastWasString && !isString) {
                this.str += ' ';
            }
            lastWasString = isString;
        }
    }

    obterTexto() {
        let txt = this.str;
        this.str = "";
        return txt;
    }
}