import "dotenv/config";
import { randomUUID } from "crypto";
import { db } from "./drizzle.ts";
import { type Sala, tableSalas } from "./salaSchema.ts";
import { tableUsers } from "./userSchema.ts";
import { tableEntidades } from "./entidadeSchema.ts";
import { type Item, tableItens } from "./itemSchema.ts";
import { salas } from "../jogo/salas/salas.ts";

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

    await db.insert(tableSalas).values(insertSalas);
    await db.insert(tableItens).values(insertItens);

    const [jogador] = await db.insert(tableUsers).values([
        { id: "00000000-0000-4000-0000-000000000000", username: "jogador", createdAt: new Date() },
    ]).returning();

    const [jogadorEntidade] = await db.insert(tableEntidades).values([
        {
            id: randomUUID(),
            categoria: "JOGADOR",
            tipo: "JOGADOR",
            salaId: "Inicio",
            usuarioId: jogador.id,
            estado: {"vivo": 1}
        },
    ]).returning();
    
    console.log("Seed inicial criado!");

} catch (error) {
    console.error("Erro:", error);
} finally {
    await db.$client.end();
}