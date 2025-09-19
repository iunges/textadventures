import { pgTable, uuid, varchar, jsonb, check, type AnyPgColumn, timestamp, integer, uniqueIndex, pgEnum, char, index } from 'drizzle-orm/pg-core';
import { getTupleFromKeys, UUID_ZERO } from './utils.ts';
import { relations } from 'drizzle-orm';
import { tableEntidades } from './entidadeSchema.ts';
import { tableSalas } from './salaSchema.ts';
import { itens } from '../jogo/config.ts';
import type { Estado } from '../jogo/types.ts';

export const enumItemNome = pgEnum('item_nome', getTupleFromKeys(itens));

export const tableLocais = pgTable('locais', {
    id: uuid('id').primaryKey().defaultRandom(),
});

export const tableItens = pgTable('itens', {
    id: uuid('id').primaryKey().defaultRandom(),

    // Que item é esse (ex: "espada", "pocao", "chave")
    nome: enumItemNome('nome').notNull(),

    // ID da pilha, calculado a partir do estado
    // Ex: "pedra", "espada-999", "pocao-12345"
    pilhaId: varchar('pilha_id', { length: 255 }).notNull(),

    // Quantidade desse item (para itens empilháveis) Sempre >= 1
    quantidade: integer('quantidade').default(1).notNull(),
    // Quando é um item inicial (spawn) de uma sala. valor que será restaurado.
    quantidadeInicial: integer('quantidade_inicial'),
    
    // Onde o item está atualmente, se onde ele está for deletado, o item também será deletado (onDelete cascade)
    ondeId: uuid('onde_id').references(() => tableLocais.id, { onDelete: 'cascade' }).notNull(),

    criadoEm: timestamp('criado_em', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    atualizadoEm: timestamp('atualizado_em', { mode: 'date', withTimezone: true }).defaultNow().notNull(),

    // Atributos dinâmicos: durabilidade, cargas, etc.
    // Ex: { "durabilidade": 82 }
    estado: jsonb('estado').$type<Estado>(),
},
    (table) => [
        // Garante que não vai duplicar pilhas de itens no mesmo local
        uniqueIndex("idx_unico_pilha_onde")
            .on(table.pilhaId, table.ondeId),
            
        index("idx_item_onde").on(table.ondeId),
    ]
);

export const itemEntidadeRelation = relations(tableItens, ({ one }) => ({
    entidade: one(tableEntidades, {
        fields: [tableItens.ondeId],
        references: [tableEntidades.id],
    }),
    sala: one(tableSalas, {
        fields: [tableItens.ondeId],
        references: [tableSalas.id],
    }),
}));

export type Item = typeof tableItens.$inferSelect;