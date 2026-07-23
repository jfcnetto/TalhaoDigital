import Dexie, { Table } from 'dexie';

// Define a interface para os cálculos pendentes
export interface CalculoPendente {
  id?: number;
  tipo: string; // Ex: 'QUEBRA_UMIDADE'
  data: string;
  sincronizado: 0 | 1;
  payload: any; // O JSON completo do laudo
}

export class TalhaoDigitalOfflineDB extends Dexie {
  calculosPendentes!: Table<CalculoPendente>;

  constructor() {
    super('TalhaoDigitalOfflineDB');
    this.version(1).stores({
      // Indexando os campos principais
      calculosPendentes: '++id, tipo, data, sincronizado'
    });
  }
}

export const dbLocal = new TalhaoDigitalOfflineDB();
