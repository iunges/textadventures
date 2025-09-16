import "dotenv/config";
import { randomUUID } from "crypto";
import { db } from "./drizzle.ts";
import { type Sala, tableSalas } from "./salaSchema.ts";
import { tableUsers } from "./userSchema.ts";
import { tableEntidades } from "./entidadeSchema.ts";
import { type Item, tableItens } from "./itemSchema.ts";
import { salas } from "../jogo/salas/salas.ts";
import bcrypt from "bcryptjs";
import { and, isNotNull, sql } from "drizzle-orm";

// Assume que acabou de dar drizzle kit push, então as tabelas estão criadas mas vazias
try {

    const insertSalas: typeof tableSalas.$inferInsert[] = [];
    const insertItens: typeof tableItens.$inferInsert[] = [];
    for(let [salaId, sala] of Object.entries(salas)) {
        insertSalas.push({
            id: salaId,
            estado: sala.estadoInicial || {}
        });

        if(sala.itensIniciais) {
            for(let item of sala.itensIniciais) {
                insertItens.push({
                    id: randomUUID(),
                    tipo: item.tipo,
                    quantidade: item.quantidade,
                    salaId: salaId,
                    estado: item.estadoInicial || {}
                });
            }
        }
    }

    // Atualiza ou insere as salas iniciais
    await db.insert(tableSalas)
        .values(insertSalas)
        .onConflictDoUpdate({
            target: tableSalas.id,
            set: {
                estado: sql`EXCLUDED.estado`,
            }
        });

    // Deleta todos os itens que estão no chão das salas
    await db.delete(tableItens).where(isNotNull(tableItens.salaId));
    // Re-insere os itens iniciais no chão das salas
    await db.insert(tableItens).values(insertItens);
    
    console.log("Seed inicial criado!");

} catch (error) {
    console.error("Erro:", error);
} finally {
    await db.$client.end();
}