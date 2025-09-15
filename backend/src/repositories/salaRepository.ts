import { eq, sql } from "drizzle-orm";
import { Sala, tableSalas } from "../db/salaSchema.ts";
import { alias } from "drizzle-orm/pg-core";
import { tableEntidades } from "../db/entidadeSchema.ts";
import { Estado } from "../db/estadoSchema.ts";
import { Item, tableItens } from "../db/itemSchema.ts";
import { DatabaseType } from "../db/drizzle.ts";

export class SalaRepository {
    static async dadosIniciaisJogador(db: DatabaseType, usuarioId: string) {
        const itensSubquery = db.select({
            salaId: tableItens.salaId,
            itens: sql<Item[]>`COALESCE(json_agg(${tableItens}.*), '{}')`.as("itens"),
            })
            .from(tableItens)
            .groupBy(tableItens.salaId)
            .as("itens_sub");

        const aliasSalaGlobal = alias(tableSalas, "global");
        const result = await db.select({
                sala: tableSalas,
                entidade: tableEntidades,
                global: aliasSalaGlobal,
                itensNoChao: itensSubquery.itens
            })
            .from(tableEntidades)
            .leftJoin(tableSalas, eq(tableEntidades.salaId, tableSalas.id))
            .leftJoin(aliasSalaGlobal, eq(aliasSalaGlobal.id, "Global"))
            .leftJoin(itensSubquery, eq(itensSubquery.salaId, tableSalas.id))
            .where(eq(tableEntidades.usuarioId, usuarioId))
            .limit(1);
    
        if(!result || result.length === 0 || !result[0]) {
            throw new Error("Usuário não existe!");
        }
    
        const { entidade, sala, global, itensNoChao } = result[0];
        if(!entidade || !sala) {
            throw new Error("Entidade em sala que não existe!");
        }

        return { 
            jogador: entidade, 
            sala: sala, 
            global: global!, 
            itensNoChao: itensNoChao || []
        };
    }

    static async getSalaById(db: DatabaseType, salaId: string): Promise<Sala | null> {
        const result = await db.select()
        .from(tableSalas)
        .where(eq(tableSalas.id, salaId))
        .limit(1);

        return result && result.length > 0 ? result[0] : null;
    }

    static async atualizar(db: DatabaseType, salaId: string, dados: { estado: Estado } ) {
        await db.update(tableSalas)
        .set({ 
            estado: dados.estado,
            atualizadoEm: new Date() 
        })
        .where(eq(tableSalas.id, salaId));
    }
}