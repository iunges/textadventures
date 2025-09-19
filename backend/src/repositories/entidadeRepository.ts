import { and, eq, gte, sql } from "drizzle-orm";
import { tableEntidades } from "../db/entidadeSchema.ts";
import { type DatabaseType } from "../db/drizzle.ts";
import { tableSalas } from "../db/salaSchema.ts";
import type { SalaNome } from "../jogo/config.ts";
import type { Estado } from "../jogo/types.ts";
import { tableItens } from "../db/itemSchema.ts";

export class EntidadeRepository {
    static async atualizar(db: DatabaseType, entidadeId: string, dados: { ondeId?: string, estado?: Estado | null } ) {
        await db.update(tableEntidades)
        .set({ 
            ondeId: dados.ondeId,
            estado: dados.estado && Object.keys(dados.estado).length === 0 ? null : dados.estado,
            atualizadoEm: sql<Date>`NOW()`,
        })
        .where(eq(tableEntidades.id, entidadeId));
    }

    static async moveParaSalaNome(db: DatabaseType, entidadeId: string, salaNome: SalaNome) {
        const result = await db.update(tableEntidades)
        .set({ 
            ondeId: tableSalas.id,
            atualizadoEm: sql<Date>`NOW()`,
        })
        .from(tableSalas)
        .where(and(eq(tableEntidades.id, entidadeId), eq(tableSalas.nome, salaNome)))
        .returning({
            entidade: tableEntidades,
            sala: tableSalas
        });

        return result.length > 0 ? result[0] : null;
    }

    static async naSala(db: DatabaseType, ondeId: string) {
        return await db.query.tableEntidades.findMany({
            where: eq(tableEntidades.ondeId, ondeId),
            with: {
                mochila: {
                    where: gte(tableItens.quantidade, 1)
                }
            }
        });
    }
}