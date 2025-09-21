import type { Contexto } from "../contexto.ts";
import { EntidadeBase } from "./base.ts";

export class EntidadeJogador extends EntidadeBase {
    static nome = "JOGADOR";
    descricao(ctx: Contexto) {
        if(this.entidade.id === ctx.jogador.entidade.id) {
            return "Você mesmo.";
        } else {
            return this.entidade.username || "um jogador";
        }
    }

    estaVisivel(): boolean {
        return Date.now() - new Date(this.entidade.atualizadoEm).getTime() <= 1000 * 60 * 10;
    }
}