export interface EstadoItem {
    [key: string]: EstadoItem | EstadoItem[] | string | number | boolean | null;
}

export type Estado = Record<string, EstadoItem | EstadoItem[] | string | number | boolean | null>;

export type ItemInfo = {
    nome: string;
    pilhaId: string;
    quantidade: number;
    ondeId: string;
    criadoEm: Date;
    atualizadoEm: Date;
    estado?: Estado | null;
};

export type SalaInfo = {
    nome: string;
    atualizadoEm: Date;
    estado?: Estado | null;
};