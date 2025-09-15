import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const tableUsers = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    username: varchar('username', { length: 50 }).unique().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof tableUsers.$inferSelect;