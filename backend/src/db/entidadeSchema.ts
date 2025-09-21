import { pgTable, uuid, varchar, jsonb, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { tableSalas } from './salaSchema.js';
import { tableUsers } from './userSchema.js';
import { tableItens, tableLocais } from './itemSchema.ts';
import { UUID_ZERO } from './utils.ts';
import { relations, sql } from 'drizzle-orm';
import type { Estado } from '../jogo/types.ts';
import { randomUUID } from 'crypto';

export const tableEntidades = pgTable('entidades', {
    // Referência para o local para itens associado a esta entidade, criado pela trigger criar_local_automatico.
    id: uuid('id').primaryKey().references(() => tableLocais.id, { onDelete: 'restrict' }).$defaultFn(() => randomUUID()),

    tipo: varchar('tipo', { length: 255 }).notNull(), // é o tipo da entidade (ex: "JOGADOR", "BAU", etc)

    // Onde a entidade está atualmente, se onde ele está for deletado, ela também será deletada (onDelete cascade)
    ondeId: uuid('onde_id').references(() => tableLocais.id, { onDelete: 'cascade' }).notNull(),

    // Se a entidade for um jogador, aqui está o link para sua conta
    username: varchar('username', { length: 50 }).references(() => tableUsers.username, { onDelete: 'restrict' }).unique(),

    criadoEm: timestamp('criado_em', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    atualizadoEm: timestamp('atualizado_em', { mode: 'date', withTimezone: true }).defaultNow().notNull(),

    // Atributos dinâmicos: vida, mana, status, etc.
    // Ex: { "vida": 85, "vida_max": 100, "status": ["envenenado"] }
    estado: jsonb('estado').$type<Estado>(),
}, 
    (table) => [
        index("idx_entidade_onde").on(table.ondeId),        
    ]
);

export const entidadeSalaRelation = relations(tableEntidades, ({ one, many }) => ({
	sala: one(tableSalas, {
		fields: [tableEntidades.ondeId],
		references: [tableSalas.id],
	}),
	mochila: many(tableItens),
    // DEPOIS: implementar relações hierárquicas entre entidades. (Para poder carregar caixas com itens)
    // entidadeFilhas: many(tableEntidades, { relationName: 'entidadeFilhas' }),
    // entidadePai: one(tableEntidades, { 
    //     relationName: 'entidadeFilhas',
    //     fields: [tableEntidades.ondeId],
    //     references: [tableEntidades.id],
    // }),
}));

export type Entidade = typeof tableEntidades.$inferSelect;