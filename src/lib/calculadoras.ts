export interface Calculadora {
  slug: string;
  nome: string;
  descricaoCurta: string;
  descricao: string;
  categoria: "Agricultura" | "Pecuária" | "Financeiro";
  plano: "Free" | "Pro";
  iconName: string;
}

export const calculadoras: Calculadora[] = [
  {
    slug: "calagem-gessagem",
    nome: "Calagem e Gessagem",
    descricaoCurta: "Saturação por bases V%",
    descricao: "Calcula a necessidade de calcário e gesso para correção do solo com base na análise de solo (saturação por bases e teor de cálcio/magnésio), otimizando a produtividade da lavoura.",
    categoria: "Agricultura",
    plano: "Pro",
    iconName: "Sprout"
  },
  {
    slug: "balanceador-npk",
    nome: "Balanceador NPK",
    descricaoCurta: "Mistura de formulações",
    descricao: "Auxilia na formulação personalizada de adubos NPK combinando diferentes fontes de fertilizantes para atingir a recomendação de adubação da cultura.",
    categoria: "Agricultura",
    plano: "Pro",
    iconName: "Settings"
  },
  {
    slug: "calibrador-bicos",
    nome: "Calibração de Bicos",
    descricaoCurta: "Vazão real (L/min)",
    descricao: "Facilita o cálculo de vazão de bicos de pulverização (L/min), volume de aplicação e velocidade de trabalho do pulverizador, reduzindo o desperdício de defensivos.",
    categoria: "Agricultura",
    plano: "Free",
    iconName: "Settings"
  },
  {
    slug: "mistura-tanque",
    nome: "Mistura de Tanque",
    descricaoCurta: "Ordem e compatibilidade",
    descricao: "Orienta na ordem correta de adição de produtos no tanque de pulverização para evitar incompatibilidade física ou química (empedramento/reação) entre defensivos.",
    categoria: "Agricultura",
    plano: "Pro",
    iconName: "Settings"
  },
  {
    slug: "quebra-umidade",
    nome: "Quebra de Umidade",
    descricaoCurta: "Desconto comercial",
    descricao: "Calcula o desconto comercial e a perda de peso físico de grãos durante o processo de secagem, ajustando a umidade colhida para a umidade padrão de comercialização.",
    categoria: "Agricultura",
    plano: "Free",
    iconName: "Wheat"
  },
  {
    slug: "rendimento-trator",
    nome: "Rendimento de Trator",
    descricaoCurta: "Campo e tempo (ha/h)",
    descricao: "Estima a capacidade de trabalho de tratores e implementos em campo (hectares por hora), considerando largura de trabalho, velocidade e eficiência da operação.",
    categoria: "Agricultura",
    plano: "Free",
    iconName: "Settings"
  },
  {
    slug: "perda-colheita",
    nome: "Perda na Colheita",
    descricaoCurta: "Amostragem Soja/Milho",
    descricao: "Avalia a perda quantitativa de grãos in lavouras de soja ou milho com base em amostragem em campo pós-colheita, permitindo regular a colheitadeira a tempo.",
    categoria: "Agricultura",
    plano: "Pro",
    iconName: "Wheat"
  },
  {
    slug: "conversor-gps",
    nome: "Conversor de GPS",
    descricaoCurta: "KML/GPX para Shapefile",
    descricao: "Ferramenta para converter arquivos de mapeamento geográfico comuns (como KML do Google Earth ou GPX de aparelhos GPS) diretamente para o formato Shapefile, padrão para agricultura de precisão.",
    categoria: "Agricultura",
    plano: "Pro",
    iconName: "Settings"
  },
  {
    slug: "conversor-unidades",
    nome: "Conversor de Unidades",
    descricaoCurta: "Alqueires, Bushels e Pesos",
    descricao: "Conversor rápido de medidas agronômicas exclusivas como sacas por alqueire paulista/mineiro, bushels de grãos para kg, libras por acre, etc.",
    categoria: "Agricultura",
    plano: "Free",
    iconName: "Scale"
  },
  {
    slug: "volume-silo",
    nome: "Volume de Silo",
    descricaoCurta: "Trincheira, Encosto e Bolsa",
    descricao: "Estima a capacidade de armazenamento de volumoso e o peso total de silagem em silos do tipo trincheira, encosto ou bolsa, facilitando o planejamento de alimentação animal.",
    categoria: "Pecuária",
    plano: "Pro",
    iconName: "Warehouse"
  },
  {
    slug: "quadrado-pearson",
    nome: "Balanceador (Pearson)",
    descricaoCurta: "% Proteína Bruta da Ração",
    descricao: "Utiliza o método matemático do Quadrado de Pearson para formular rações animais de custo mínimo que atendam às necessidades exatas de Proteína Bruta (PB).",
    categoria: "Pecuária",
    plano: "Pro",
    iconName: "Dna"
  },
  {
    slug: "suporte-pastagem",
    nome: "Suporte de Pastagem",
    descricaoCurta: "Capacidade de Lotação (UA/ha)",
    descricao: "Calcula o potencial de lotação das pastagens em Unidades Animal por Hectare (UA/ha) com base na produção de forragem disponível e taxa de consumo.",
    categoria: "Pecuária",
    plano: "Pro",
    iconName: "Sprout"
  },
  {
    slug: "rendimento-carcaca",
    nome: "Rendimento de Carcaça",
    descricaoCurta: "Peso de Carcaça e Valor @",
    descricao: "Estima o rendimento de carcaça de bovinos após o abate e calcula o preço equivalente da arroba (@) com base no peso vivo e preço de venda.",
    categoria: "Pecuária",
    plano: "Pro",
    iconName: "TrendingUp"
  },
  {
    slug: "gestacao-vacas",
    nome: "Gestão Gestacional Vacas",
    descricaoCurta: "Previsão de Parto e Secagem",
    descricao: "Acompanha o calendário reprodutivo de vacas leiteiras ou de corte, prevendo datas prováveis de parto e programando períodos de secagem e vacinação.",
    categoria: "Pecuária",
    plano: "Free",
    iconName: "Calendar"
  },
  {
    slug: "depreciacao-maquinas",
    nome: "Depreciação de Máquinas",
    descricaoCurta: "Custo horário e linear",
    descricao: "Calcula a depreciação linear de máquinas agrícolas e estima o custo operacional por hora trabalhada (combustível, lubrificantes, manutenção, operador e juros).",
    categoria: "Financeiro",
    plano: "Pro",
    iconName: "Settings"
  },
  {
    slug: "ponto-equilibrio",
    nome: "Margem de Contribuição por Hectare",
    descricaoCurta: "Margem por ha e sacas/ha",
    descricao: "Analisa a viabilidade financeira e o ponto de equilíbrio de cultivos agrícolas por hectare, determinando a produção mínima em sacas para cobrir os custos operacionais (Ponto de Equilíbrio).",
    categoria: "Financeiro",
    plano: "Pro",
    iconName: "Scale"
  },
  {
    slug: "simulador-barter",
    nome: "Simulador de Barter",
    descricaoCurta: "Troca de grãos por insumos",
    descricao: "Simula contratos de barter onde insumos agrícolas são pagos com a entrega física da produção futura de grãos, demonstrando a taxa implícita da operação.",
    categoria: "Financeiro",
    plano: "Pro",
    iconName: "Coins"
  },
  {
    slug: "planejador-compras",
    nome: "Planejador de Compras",
    descricaoCurta: "À vista vs. Prazo e CDI",
    descricao: "Avalia se é financeiramente mais vantajoso comprar insumos à vista com desconto ou a prazo, calculando a rentabilidade do dinheiro investido à taxa do CDI atual.",
    categoria: "Financeiro",
    plano: "Pro",
    iconName: "PiggyBank"
  },
  {
    slug: "transicao-organicos",
    nome: "Transição Orgânica",
    descricaoCurta: "Viabilidade e conversão",
    descricao: "Projeta o fluxo de caixa, custos de certificação, queda temporária de produtividade e margem de ganho futuro na transição de cultivo convencional para orgânico.",
    categoria: "Financeiro",
    plano: "Pro",
    iconName: "Leaf"
  }
];
