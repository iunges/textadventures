import { and, eq, gte, isNotNull, sql } from "drizzle-orm";
import { type Sala, tableSalas } from "../db/salaSchema.ts";
import { alias } from "drizzle-orm/pg-core";
import { type Entidade, tableEntidades } from "../db/entidadeSchema.ts";
import { type Item, tableItens, tableLocais } from "../db/itemSchema.ts";
import { type DatabaseType } from "../db/drizzle.ts";
import { RevokeSessionError } from "../middlewares/authMiddleware.ts";
import { mapArrayWithTable } from "../db/utils.ts";
import type { SalaNome } from "../jogo/config.ts";
import type { Estado } from "../jogo/types.ts";

export class SalaRepository {
    static async dadosIniciaisJogador(db: DatabaseType, username: string) {
        const jogadorResult = await db.select({
            ondeId: tableEntidades.ondeId,
            global: tableSalas
        })
        .from(tableEntidades)
        .leftJoin(tableSalas, eq(tableSalas.nome, "Global"))
        .where(eq(tableEntidades.username, username))
        .limit(1);

        if(jogadorResult.length === 0 || !jogadorResult[0].ondeId) {
            throw new RevokeSessionError("Usuário ou entidade não existe!");
        }
        const { ondeId, global } = jogadorResult[0];

        const result = await db.query.tableSalas.findFirst({
            where: eq(tableSalas.id, ondeId),
            with: {
                itens: true,
                entidades: {
                    with: {
                        mochila: true
                    }
                }
            }
        });
            
        if(!result) {
            throw new RevokeSessionError("Usuário em sala que não existe!");
        }

        const { itens, entidades, ...sala } = result;
        
        const index = entidades.findIndex(e => e.username === username);
        if(index < 0 ) {
            throw new RevokeSessionError("Jogador não está na sala!");
        }
        const { mochila, ...jogador} = entidades.splice(index, 1)[0];

        return {
            jogador: jogador,
            sala: sala,
            global: global!,
            itensNoChao: itens.filter(i => i.quantidade > 0),
            mochila: mochila.filter(i => i.quantidade > 0),
            entidadesNaSala: entidades,
        };
    }

    static async getSalaById(db: DatabaseType, salaId: string): Promise<Sala | null> {
        const result = await db.select()
        .from(tableSalas)
        .where(eq(tableSalas.id, salaId))
        .limit(1);

        return result && result.length > 0 ? result[0] : null;
    }

    static async getSalaByNome(db: DatabaseType, sala: SalaNome): Promise<Sala | null> {
        const result = await db.select()
        .from(tableSalas)
        .where(eq(tableSalas.nome, sala))
        .limit(1);

        return result && result.length > 0 ? result[0] : null;
    }

    static async atualizar(db: DatabaseType, salaId: string, dados: { estado: Estado | null } ) {
        await db.update(tableSalas)
        .set({ 
            estado: dados.estado && Object.keys(dados.estado).length > 0 ? dados.estado : null,
            atualizadoEm: sql<Date>`NOW()`, 
        })
        .where(eq(tableSalas.id, salaId));
    }
}