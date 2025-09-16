import { eq } from "drizzle-orm";
import { tableEntidades } from "../db/entidadeSchema.ts";
import { type Estado } from "../db/estadoSchema.ts";
import { type DatabaseType } from "../db/drizzle.ts";

export class EntidadeRepository {
    static async atualizar(db: DatabaseType, entidadeId: string, dados: { salaId?: string, estado?: Estado } ) {
        await db.update(tableEntidades)
        .set({ 
            salaId: dados.salaId,
            estado: dados.estado,
            atualizadoEm: new Date() 
        })
        .where(eq(tableEntidades.id, entidadeId));
    }

    static async naSala(db: DatabaseType, salaId: string) {
        const result = await db.select()
            .from(tableEntidades)
            .where(eq(tableEntidades.salaId, salaId));

        return result;
    }
}