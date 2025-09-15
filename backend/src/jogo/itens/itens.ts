import { ItemType } from "../contexto.ts";
import { itensInicio } from "./inicio.ts";

export const itens: Record<string, ItemType> = {
    ...itensInicio,
};

export const getItemConfig = (itemTipo: string) => {
    let itemConfig = itens[itemTipo];
    if(!itemConfig) {
        throw new Error(`Item com tipo ${itemTipo} não existe na configuração do jogo!`);
    }

    return itemConfig;
}