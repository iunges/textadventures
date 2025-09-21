// Contexto do jogo a ser usado nas funções das salas e comandos
import { db } from "../db/drizzle.ts";
import { gerarPilhaId, getEntidadeConfig, getItemConfig, getSalaConfig } from "./config.ts";

import { SalaRepository } from "../repositories/salaRepository.ts";
import type { EntidadeJogador } from "./entidades/jogador.ts";
import type { SalaBase, SalaBaseStatic } from "./salas/base.ts";
import type { ItemBase, ItemBaseStatic } from "./itens/base.ts";
import type { EntidadeBase } from "./entidades/base.ts";
import { EntidadeRepository } from "../repositories/entidadeRepository.ts";
import type { Sala } from "../db/salaSchema.ts";
import type { Item } from "../db/itemSchema.ts";
import { execArrowOrValue, type Estado } from "./types.ts";
import { ItemRepository } from "../repositories/itemRepository.ts";

// Serve como service que interage com o banco de dados, e guarda o estado atual do jogo
export class Contexto {
    /*jogador: Entidade;

    mochila: Item[] | null = null;
    async getMochila() {
        if(this.mochila) return this.mochila;

        this.mochila = await ItemRepository.listarPorLocal(db, this.jogador.id);
        return this.mochila;
    }

    itensNoChao: Item[] | null = null;
    async getItensNoChao(nome?: SalaNome) {
        if(!nome) {
            if(this.itensNoChao) return this.itensNoChao;

            const sala = await this.getSala();
            this.itensNoChao = await ItemRepository.listarPorLocal(db, sala.id);
            return this.itensNoChao;
        } else {
            const sala = await SalaRepository.getSalaByNome(db, nome);
            if (!sala) {
                throw new Error("Sala não existe! "+ nome);
            }
            return await ItemRepository.listarPorLocal(db, sala.id);
        }
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
    }*/

    jogador: EntidadeJogador;
    sala: SalaBase;
    global: SalaBase;

    private str: string;

    /*constructor({ jogador, sala, global, itensNoChao, mochila, entidadesNaSala }: {
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
    }*/

    constructor({ sala, global, jogador }: {
        sala: SalaBase,
        global: SalaBase,
        jogador: EntidadeJogador
    }) {
        this.sala = sala;
        this.global = global;
        this.jogador = jogador;
        this.str = "";      
    }

    static async carregar(username: string, ondeId: string, global: Sala) {
        const { sala, entidades, itens } = await SalaRepository.carregarSalaCompleta(db, ondeId);

        const salaItens: ItemBase[] = [];
        const salaEntidades: EntidadeBase[] = [];
        let jogador: EntidadeJogador | undefined = undefined;
        const salaConfig = await getSalaConfig(sala.nome, { sala: sala, itens: salaItens, entidades: salaEntidades });
        const globalConfig = await getSalaConfig(global.nome, { sala: global });
                
        for(let item of itens) {
            const itemConfig = await getItemConfig(item.nome, { item: item, onde: salaConfig });
            salaItens.push(itemConfig);
        }

        for(let ent of entidades) {
            const entidadeMochila: ItemBase[] = [];
            const { mochila, ...entidade } = ent;
            const entidadeConfig = await getEntidadeConfig(ent.tipo, { entidade: entidade, onde: salaConfig, itens: entidadeMochila, filhos: [] });
            for(let item of mochila) {
                const itemConfig = await getItemConfig(item.nome, { item: item, onde: entidadeConfig });
                entidadeMochila.push(itemConfig);
            }
            salaEntidades.push(entidadeConfig);

            if(entidade.tipo === 'JOGADOR' && entidade.username === username) {
                jogador = entidadeConfig as EntidadeJogador;
            }
        }

        if(!jogador) {
            throw new Error("Jogador não encontrado na sala!");
        }

        return {
            sala: salaConfig,
            global: globalConfig,
            jogador: jogador
        };
    }

    async _descricaoItens(itens: ItemBase[]) {
        const descricaoItens = [];
        for(let i of itens) {
            const acoes = await i._acoes(this);
            const descr = "$DESCRICAO" in acoes ? await execArrowOrValue(acoes["$DESCRICAO"]) : "";
            if(descr && typeof descr === "string") {
                this.escrevaln(descr);
            }            
            const descricaoItem = this.obterTexto();

            descricaoItens.push({
                id: i.item.id,
                nome: i.item.nome,
                quantidade: i.item.quantidade,
                atualizadoEm: i.item.atualizadoEm,
                descricao: descricaoItem,
                acoes: Object.keys(acoes).filter(a => !a.startsWith("$"))
            });
        }
        return descricaoItens;
    }

    async _descricaoEntidades(entidades: EntidadeBase[]) {
        const descricaoEntidades = [];
        for(let e of entidades) {
            const acoes = await e._acoes(this);
            const descr = "$DESCRICAO" in acoes ? await execArrowOrValue(acoes["$DESCRICAO"]) : "";
            if(descr && typeof descr === "string") {
                this.escrevaln(descr);
            }            
            const descricaoEntidade = this.obterTexto();
            const { itens, filhos } = e.getFilhosVisiveis();
            const descrItens = await this._descricaoItens(itens);
            const descrFilhos: any = await this._descricaoEntidades(filhos);
            
            descricaoEntidades.push({
                id: e.entidade.id,
                tipo: e.entidade.tipo,
                username: e.entidade.username,
                atualizadoEm: e.entidade.atualizadoEm,
                descricao: descricaoEntidade,
                acoes: Object.keys(acoes).filter(a => !a.startsWith("$")),
                itens: descrItens,
                filhos: descrFilhos
            });
        }
        return descricaoEntidades;
    }

    async retornarSituacao() {
        const resposta = this.obterTexto();

        const [descricaoJogador] = await this._descricaoEntidades([this.jogador]);
        
        /*const temLuz = this.sala.temLuz();
        if(!temLuz) {
            this.escrevaln("Está muito escuro, você não consegue ver nada.");
            const descricaoSala = this.obterTexto();
            
            return {
                resposta: resposta,
                jogador: {
                    ...descricaoJogador,
                    ondeId: this.jogador.entidade.ondeId,
                },
                sala: {
                    id: this.sala.sala.id,
                    nome: this.sala.sala.nome,
                    atualizadoEm: this.sala.sala.atualizadoEm,
                    conexoes: [],
                    descricao: descricaoSala,
                    itens: [],
                    entidades: [],
                }
            };
        }*/

        let descricaoSala = "";
        let acoes = {};
        if(!this.sala.estaVisivel()) {
            this.escrevaln("Está muito escuro, você não consegue ver nada.");
            descricaoSala = this.obterTexto();
        } else {
            acoes = await this.sala._acoes(this);
            const descr = "$DESCRICAO" in acoes ? await execArrowOrValue(acoes["$DESCRICAO"]) : "";
            if(descr && typeof descr === "string") {
                this.escrevaln(descr);
            }
            descricaoSala = this.obterTexto();
        }

        const { itens, entidades } = this.sala.getFilhosVisiveis();
        const descricaoItensNochao = await this._descricaoItens(itens);
        const descricaoEntidades = await this._descricaoEntidades(entidades.filter(e => e.entidade.id !== this.jogador.entidade.id));

        return {
            resposta: resposta,
            jogador: {
                ...descricaoJogador,
                ondeId: this.jogador.entidade.ondeId,
            },
            sala: {
                id: this.sala.sala.id,
                nome: this.sala.sala.nome,
                atualizadoEm: this.sala.sala.atualizadoEm,
                acoes: Object.keys(acoes).filter(a => !a.startsWith("$")),
                descricao: descricaoSala,
                itens: descricaoItensNochao,
                entidades: descricaoEntidades,
            },
        };
    }
    
    // =========================================================================
    //                 Funções que alteram o estado do jogo  
    // =========================================================================
    async moverParaSala(novaSala: typeof SalaBase & SalaBaseStatic) {
        const { entidade, sala } = (await EntidadeRepository.moveParaSalaNome(db, this.jogador.entidade.id, novaSala.nome)) || {};
        if(!entidade || !sala) {
            throw new Error("Erro ao mover para a sala " + novaSala.nome);
        }
        
        const info = await Contexto.carregar(this.jogador.entidade.username!, sala.id, this.global.sala);
        this.sala = info.sala;
        this.global = info.global;
        this.jogador = info.jogador;
    }
    
    
    async moverItem(i: ItemBase, { quantidade, ondeId, estado }: { 
        quantidade: number,
        ondeId: string | null,
        estado?: Estado | null,
    }) {
        if(ondeId === null) {
            // Descarta o item
            await ItemRepository.removerItem(db, i.item.id, quantidade);
        } else {
            // Move o item para outro lugar
            if(estado) {
                estado = { ...(i.item.estado || {}), ...estado };
            } else {
                estado = i.item.estado;
            }
            await ItemRepository.moverItem(db, i.item.id, { quantidade, ondeId, pilhaId: gerarPilhaId(i.item.nome, estado), estado });
        }

        //this.mochila = null;
        //this.itensNoChao = null;
        // A FAZER: atualizar só em memória.

        const info = await Contexto.carregar(this.jogador.entidade.username!, this.sala.sala.id, this.global.sala);
        this.sala = info.sala;
        this.global = info.global;
        this.jogador = info.jogador;
    }

    async criarItem(item: { item: typeof ItemBase & ItemBaseStatic, estado?: Estado | null, quantidade: number, ondeId: string }) {
        await ItemRepository.adicionarItem(db, {
            nome: item.item.nome,
            pilhaId: gerarPilhaId(item.item.nome, item.estado),
            quantidade: item.quantidade,
            estado: item.estado,
            ondeId: item.ondeId,
        });

        //this.mochila = null;
        //this.itensNoChao = null;
        // A FAZER: atualizar só em memória.


        const info = await Contexto.carregar(this.jogador.entidade.username!, this.sala.sala.id, this.global.sala);
        this.sala = info.sala;
        this.global = info.global;
        this.jogador = info.jogador;
    }

    async alterarEstadoSala(novoEstado: Estado | null) {
        const sala = this.sala.sala;
        if(novoEstado) {
            sala.estado = { ...(sala.estado || {}), ...novoEstado };
        } else {
            sala.estado = null;
        }
        await SalaRepository.atualizar(db, sala.id, { estado: sala.estado });
    }

    async alterarEntidade(entidade: EntidadeBase, { ondeId, estado }: { 
        ondeId?: string | null,
        estado?: Estado | null,
    }) {
        const ent = entidade.entidade;
        if(ondeId === null) {
            // Deleta a entidade
            await EntidadeRepository.deletar(db, ent.ondeId, ent.id);
        } else {
            // Move a entidade para outro lugar
            if(estado) {
                estado = { ...(ent.estado || {}), ...estado };
            }
            const result = await EntidadeRepository.atualizar(db, ent.id, { ondeId: ondeId, estado: estado });
            ent.estado = result.estado;
        }
        // A FAZER: atualizar só em memória.

        const info = await Contexto.carregar(this.jogador.entidade.username!, this.sala.sala.id, this.global.sala);
        this.sala = info.sala;
        this.global = info.global;
        this.jogador = info.jogador;
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