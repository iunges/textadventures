import { sql } from "drizzle-orm";
import type { DatabaseType } from "../drizzle.ts";

export class TriggerAplicarLocal {
    /**
    Sim, absolutamente! Sua intuição está perfeita. Usar um gatilho (trigger) é a solução ideal e mais elegante para automatizar a inserção na tabela locais, resolvendo completamente o problema da inserção em duas etapas.
    Você está transformando uma complexidade que estaria no seu código da aplicação em uma regra de negócio automatizada e segura dentro do próprio banco de dados.
    Como Funciona a Mágica: O Gatilho BEFORE INSERT
    
    A estratégia é criar um gatilho que é acionado antes de uma nova linha ser inserida em uma tabela "concreta" (como salas ou entidades). O processo é o seguinte:
    Seu código da aplicação tenta fazer um INSERT simples na tabela salas.
    O PostgreSQL intercepta essa tentativa e aciona o gatilho BEFORE INSERT.

    Dentro do gatilho:
    a. Ele primeiro insere uma nova linha na tabela locais.
    b. Ele captura o id recém-criado da tabela locais.
    c. Ele pega a linha que estava prestes a ser inserida na salas (representada pela variável NEW) e injeta o id do local no campo NEW.local_id.

    O gatilho termina e devolve a linha NEW (agora modificada) para o processo de inserção original.
    O INSERT na salas é concluído, agora com o local_id preenchido corretamente.

    Tudo isso acontece de forma atômica, dentro de uma única transação.
    */
    static async create(db: DatabaseType) {
        // -----------------------------------------
        // Trigger para criar local automaticamente
        // -----------------------------------------
        console.log(await db.execute(sql`
            CREATE OR REPLACE FUNCTION criar_local_automatico()
            RETURNS TRIGGER AS $$
            BEGIN
                -- 1. Insere uma nova linha na tabela de locais e captura o ID gerado.
                INSERT INTO public.locais(id) VALUES (NEW.id);

                -- 3. Retorna a linha modificada para que a operação de INSERT original possa continuar.
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `));

        // -----------------------------------------
        // Trigger para deletar local automaticamente 
        // (Reverse onDelete Cascade)
        // -----------------------------------------
        await db.execute(sql`
            CREATE OR REPLACE FUNCTION deletar_local_automatico()
            RETURNS TRIGGER AS $$
            DECLARE
                item_count INTEGER;
            BEGIN
                -- A fk vai fazer o Delete dos itens se tiver nesse local
                DELETE FROM public.locais WHERE id = OLD.id;

                RETURN OLD;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // Aplicar a trigger em cada tabela.
        for (const tabela of ['salas', 'entidades']) {
            console.log(await db.execute(sql.raw(`
                CREATE OR REPLACE TRIGGER trigger_criar_local_para_${tabela}
                BEFORE INSERT ON public.${tabela}
                FOR EACH ROW EXECUTE FUNCTION criar_local_automatico();
            `)));

            console.log(await db.execute(sql.raw(`
                CREATE OR REPLACE TRIGGER trigger_deletar_local_para_${tabela}
                AFTER DELETE ON public.${tabela}
                FOR EACH ROW EXECUTE FUNCTION deletar_local_automatico();
            `)));
        }
    }
}