// Contexto do jogo a ser usado nas funções das salas e comandos
import { db } from "../db/drizzle.ts";
import { getItemConfig, getSalaConfig, type ItemTipo, type SalaNome } from "./config.ts";

import { type Entidade } from "../db/entidadeSchema.ts";
import { type Item } from "../db/itemSchema.ts";
import { type Sala } from "../db/salaSchema.ts";
import { EntidadeRepository } from "../repositories/entidadeRepository.ts";
import { ItemRepository } from "../repositories/itemRepository.ts";
import { SalaRepository } from "../repositories/salaRepository.ts";
import type { Estado } from "./types.ts";
import { UUID_ZERO } from "../db/utils.ts";

// Serve como service que interage com o banco de dados, e guarda o estado atual do jogo
export class Contexto {
    jogador: Entidade;

    mochila: Item[] | null = null;
    async getMochila() {
        if(this.mochila) return this.mochila;

        this.mochila = await ItemRepository.listarPorLocal(db, this.jogador.id);
        return this.mochila;
    }

    itensNoChao: Item[] | null = null;
    async getItensNoChao() {
        if(this.itensNoChao) return this.itensNoChao;

        const sala = await this.getSala();
        this.itensNoChao = await ItemRepository.listarPorLocal(db, sala.id);
        return this.itensNoChao;
    }

    entidadesNaSala: (Entidade & {mochila: Item[]})[] | null = null;
    async getEntidadesNaSala() {
        if(this.entidadesNaSala) return this.entidadesNaSala;

        const sala = await this.getSala();
        this.entidadesNaSala = (await EntidadeRepository.naSala(db, sala.id)).filter(e => e.id !== this.jogador.id);
        return this.entidadesNaSala;
    }

    global: Sala;

    sala: Sala | null;
    async getSala() {
        if(this.sala) return this.sala;
        
        this.sala = await SalaRepository.getSalaById(db, this.jogador.ondeId);
        if (!this.sala) {
            throw new Error("Sala para onde o jogador tentou ir não existe!");
        }

        return this.sala;
    }

    private str: string;

    constructor({ jogador, sala, global, itensNoChao, mochila, entidadesNaSala }: {
        jogador: Entidade,
        sala: Sala | null,
        global: Sala,
        itensNoChao: Item[] | null,
        mochila: Item[] | null,
        entidadesNaSala: (Entidade & {mochila: Item[]})[] | null,
    }) {
        this.jogador = jogador;
        this.global = global;
        this.sala = sala;
        this.str = "";
        this.itensNoChao = itensNoChao;
        this.mochila = mochila;
        this.entidadesNaSala = entidadesNaSala;
    }

    static async carregar(username: string): Promise<Contexto> {
        const result = await SalaRepository.dadosIniciaisJogador(db, username);
        return new Contexto(result);
    }

    static async _descricaoItens(ctx: Contexto, itens: Item[]) {
        const descricaoItens = [];
        for(let item of itens) {
            const itemConfig = getItemConfig(item.nome as ItemTipo);
            const descr = await itemConfig.descricao(ctx, item);
            if(descr) {
                ctx.escrevaln(descr);
            }
            descricaoItens.push({
                id: item.id,
                nome: item.nome,
                quantidade: item.quantidade,
                atualizadoEm: item.atualizadoEm,
                descricao: ctx.obterTexto(),
            });
        }
        return descricaoItens;
    }

    async retornarSituacao() {
        const sala = await this.getSala();
        let salaConfig = getSalaConfig(sala.nome as SalaNome);

        const resposta = this.obterTexto();

        const temLuz = await this.temLuz();
        if(!temLuz) {
            this.escrevaln("Está muito escuro, você não consegue ver nada.");
            const descricaoSala = this.obterTexto();
            const descricaoMochila = await Contexto._descricaoItens(this, await this.getMochila());

            return {
                resposta: resposta,
                jogador: {
                    id: this.jogador.id,
                    username: this.jogador.username,
                    ondeId: this.jogador.ondeId,                
                    atualizadoEm: this.jogador.atualizadoEm,
                    mochila: descricaoMochila,
                },
                sala: {
                    id: sala.id,
                    nome: sala.nome,
                    atualizadoEm: sala.atualizadoEm,
                    conexoes: [],
                    descricao: descricaoSala,
                    itens: [],
                    entidades: [],
                }
            };
        }
        
        const descr = await salaConfig.descricao(this, sala);
        if(descr) {
            this.escrevaln(descr);
        }
        const descricaoSala = this.obterTexto();

        const descricaoItensNochao = await Contexto._descricaoItens(this, await this.getItensNoChao());
        const descricaoMochila = await Contexto._descricaoItens(this, await this.getMochila());
        const descricaoEntidades = (await this.getEntidadesNaSala()).map(e => ({
            id: e.id,
            categoria: e.categoria,
            tipo: e.tipo,
            username: e.username,
            atualizadoEm: e.atualizadoEm,
            descricao: e.tipo === 'JOGADOR' ? "" : `um ${e.tipo.toLowerCase()}`,
        }));

        return {
            resposta: resposta,
            jogador: {
                id: this.jogador.id,
                username: this.jogador.username,
                ondeId: this.jogador.ondeId,                
                atualizadoEm: this.jogador.atualizadoEm,
                mochila: descricaoMochila,
            },
            sala: {
                id: sala.id,
                nome: sala.nome,
                atualizadoEm: sala.atualizadoEm,
                conexoes: Object.keys(salaConfig.conexoes),
                descricao: descricaoSala,
                itens: descricaoItensNochao,
                entidades: descricaoEntidades,
            },
        };
    }

    async temLuz(): Promise<boolean> {
        const sala = await this.getSala();
        if(sala.estado?.luz === true) return true;

        let chao = await this.getItensNoChao();
        for(let obj of chao) {
            if(obj.estado?.luz === true) return true;
        }

        let mochila = await this.getMochila();
        for(let obj of mochila) {
            if(obj.estado?.luz === true) return true;
        }

        let entidades = await this.getEntidadesNaSala();
        for(let ent of entidades) {
            if(ent.estado?.luz === true) return true;
            for(let obj of ent.mochila) {
                if(obj.estado?.luz === true) return true;
            }
        }

        return false;
    }

    // =========================================================================
    //                 Funções que alteram o estado do jogo  
    // =========================================================================
    async moverParaSala(novaSalaNome: SalaNome) {
        const { entidade, sala } = (await EntidadeRepository.moveParaSalaNome(db, this.jogador.id, novaSalaNome)) || {};
        if(!entidade || !sala) {
            throw new Error("Erro ao mover para a sala " + novaSalaNome);
        }
        this.jogador = entidade;
        this.sala = sala;

        this.entidadesNaSala = null;
        this.itensNoChao = null;
    }

    async moverItem(item: Item, { quantidade, ondeId, estado }: { 
        quantidade: number,
        ondeId: string | null,
        estado?: Estado | null,
    }) {
        if(ondeId === null) {
            // Descarta o item
            await ItemRepository.removerItem(db, item.id, quantidade);
        } else {
            // Move o item para outro lugar
            // A FAZER: lidar com pilhaId quando mudar o estado
            if(estado) {
                estado = { ...(item.estado || {}), ...estado };
            }
            await ItemRepository.moverItem(db, item.id, { quantidade, ondeId, pilhaId: item.nome, estado });
        }

        this.mochila = null;
        this.itensNoChao = null;
    }

    async criarItem(item: { nome: ItemTipo, estado?: Estado | null, quantidade: number, ondeId: string }) {
        await ItemRepository.adicionarItem(db, {
            nome: item.nome,
            pilhaId: item.nome, // A FAZER: lidar com pilhaId ligado ao estado
            quantidade: item.quantidade,
            estado: item.estado,
            ondeId: item.ondeId,
        });

        this.mochila = null;
        this.itensNoChao = null;
    }

    async alterarEstadoSala(novoEstado: Estado | null) {
        const sala = await this.getSala();

        if(novoEstado) {
            sala.estado = { ...(sala.estado || {}), ...novoEstado };
        } else {
            sala.estado = null;
        }
        await SalaRepository.atualizar(db, sala.id, { estado: sala.estado });
    }
    
    // =========================================================================
    //                 Funções para escrever na resposta  
    // =========================================================================
    
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