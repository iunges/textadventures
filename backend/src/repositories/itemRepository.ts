import { and, eq, gte, sql } from "drizzle-orm";
import { type Item, tableItens } from "../db/itemSchema.ts";
import { type DatabaseType } from "../db/drizzle.ts";
import type { Estado } from "../db/estadoSchema.ts";

export class ItemRepository {
    static async naMochila(db: DatabaseType, entidadeId: string): Promise<Item[]> {
        const itens = await db.select()
            .from(tableItens)
            .where(and(
                eq(tableItens.localTipo, "ENTIDADE"), 
                eq(tableItens.localId, entidadeId),
                gte(tableItens.quantidade, 1)
            ));
        return itens;
    }

    static async noChao(db: DatabaseType, salaId: string): Promise<Item[]> {
        const itens = await db.select()
            .from(tableItens)
            .where(and(
                eq(tableItens.localTipo, "SALA"), 
                eq(tableItens.localId, salaId),
                gte(tableItens.quantidade, 1)
            ));
        return itens;
    }

    static async moverItem(db: DatabaseType, itemId: string, quantidade: number, onde: { entidadeId?: string } | { salaId?: string } | { itemContainerId?: string }) {
        const result = await db.transaction(async (tx) => {

            const agora = new Date();
            const localTipo = "entidadeId" in onde && onde.entidadeId ? "ENTIDADE" : "salaId" in onde && onde.salaId ? "SALA" : "itemContainerId" in onde && onde.itemContainerId ? "CONTAINER" : undefined;
            const localId = ("entidadeId" in onde && onde.entidadeId) || ("salaId" in onde && onde.salaId) || ("itemContainerId" in onde && onde.itemContainerId);
            if(!localTipo || !localId) {
                throw new Error("Quer colocar onde? lugar nenhum?");
            }

            // 1. Retira o item de onde ele está agora (Não tem problema deixar 0 itens)
            const [itemAtual] = await tx.update(tableItens).set({
                quantidade: sql<number>`(${tableItens.quantidade} - ${quantidade})`,
                atualizadoEm: agora
            }).where(and(eq(tableItens.id, itemId), gte(tableItens.quantidade, quantidade)))
            .returning();

            if(!itemAtual) {
                throw new Error("Item não existe ou não pode pegar tudo isso!");
            }

            // 2. Tenta inserir o item no destino com onConflictUpdate
            const [result] = await tx.insert(tableItens).values({
                tipo: itemAtual.tipo,
                quantidade: quantidade,
                localTipo: localTipo,
                localId: localId,
                estado: itemAtual.estado,
                criadoEm: itemAtual.criadoEm,
                atualizadoEm: agora,
            }).onConflictDoUpdate({
                target: [tableItens.tipo, tableItens.localTipo, tableItens.localId],
                set: {
                    quantidade: sql<number>`(${tableItens.quantidade} + ${quantidade})`,
                    atualizadoEm: agora
                }
            }).returning();

            return result;
        });

        return result;
    }

    static async criarItem(db: DatabaseType, dados: {
        tipo: string,
        estado?: Estado
    }, quantidade: number, onde: { entidadeId?: string } | { salaId?: string } | { itemContainerId?: string }) {
        const agora = new Date();
        const localTipo = "entidadeId" in onde && onde.entidadeId ? "ENTIDADE" : "salaId" in onde && onde.salaId ? "SALA" : "itemContainerId" in onde && onde.itemContainerId ? "CONTAINER" : undefined;
        const localId = ("entidadeId" in onde && onde.entidadeId) || ("salaId" in onde && onde.salaId) || ("itemContainerId" in onde && onde.itemContainerId);
        if(!localTipo || !localId) {
            throw new Error("Quer colocar onde? lugar nenhum?");
        }

        const [result] = await db.insert(tableItens).values({
            tipo: dados.tipo,
            quantidade: quantidade,
            localTipo: localTipo,
            localId: localId,
            estado: dados.estado || {},
        }).onConflictDoUpdate({
            target: [tableItens.tipo, tableItens.localTipo, tableItens.localId],
            set: {
                quantidade: sql<number>`(${tableItens.quantidade} + ${quantidade})`,
                atualizadoEm: agora
            }
        }).returning();

        return result;
    }
}