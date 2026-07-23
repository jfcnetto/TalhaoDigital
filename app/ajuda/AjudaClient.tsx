"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, HelpCircle, Leaf, Coins, Calendar, Sprout, Wheat, Settings, Warehouse, Dna, TrendingUp, Scale, PiggyBank, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AjudaClient() {
  const [busca, setBusca] = useState("");

  const calculadoras = [
    {
      id: "calagem-gessagem",
      categoria: "agricultura",
      nome: "Calagem e Gessagem",
      icone: Sprout,
      slug: "/ferramentas/calagem-gessagem",
      objetivo: "Calcular a necessidade de calcário e gesso agrícola para neutralizar o alumínio tóxico e fornecer cálcio e magnésio ao solo, elevando a saturação por bases (V%).",
      campos: [
        "Saturação por bases atual (V1) e desejada (V2) obtidas da análise de solo.",
        "PRNT (Poder Relativo de Neutralização Total) do calcário a ser utilizado.",
        "Teores de Cálcio, Magnésio, Potássio e Alumínio para o cálculo de gessagem.",
      ],
      interpretacao: "A ferramenta indica a quantidade exata de calcário (ton/ha) e gesso (ton/ha) a aplicar na área, garantindo o ambiente radicular ideal para o desenvolvimento das plantas.",
    },
    {
      id: "balanceador-npk",
      categoria: "agricultura",
      nome: "Balanceador NPK",
      icone: Settings,
      slug: "/ferramentas/balanceador-npk",
      objetivo: "Calcular as proporções corretas de matérias-primas individuais (como Ureia, Superfosfato Simples/Triplo e Cloreto de Potássio) para formular misturas NPK personalizadas.",
      campos: [
        "A fórmula comercial desejada (ex: 04-14-08, 10-10-10, etc.).",
        "A quantidade total em quilos (kg) que você deseja misturar no barracão.",
      ],
      interpretacao: "O balanceador divide a mistura em sacos ou kg de cada matéria-prima pura, economizando dinheiro em relação à compra de formulações comerciais prontas.",
    },
    {
      id: "calibrador-bicos",
      categoria: "agricultura",
      nome: "Calibração de Bicos",
      icone: Settings,
      slug: "/ferramentas/calibrador-bicos",
      objetivo: "Calibrar a pulverização terrestre para garantir que o volume de calda aplicado por hectare (L/ha) corresponda exatamente à recomendação técnica, evitando subdosagem ou desperdícios.",
      campos: [
        "Vazão média medida nos bicos (L/min) usando copo calibrador.",
        "Espaçamento entre os bicos na barra do pulverizador (metros).",
        "Velocidade de trabalho do trator (km/h).",
      ],
      interpretacao: "Informa o volume real de calda que está sendo aplicado na lavoura (L/ha) e orienta se é preciso aumentar/diminuir a pressão ou trocar as pontas de pulverização.",
    },
    {
      id: "mistura-tanque",
      categoria: "agricultura",
      nome: "Mistura de Tanque",
      icone: Settings,
      slug: "/ferramentas/mistura-tanque",
      objetivo: "Verificar a ordem correta de adição de defensivos e adjuvantes no tanque do pulverizador para evitar reações químicas indesejadas (como a formação de 'nata' ou 'cristais').",
      campos: [
        "Seleção de produtos por formulação (Ex: WG, EC, SL, SC, óleos, fertilizantes foliares).",
      ],
      interpretacao: "Exibe a sequência lógica passo a passo que deve ser seguida pelo operador de pulverização para misturar os produtos com máxima segurança e compatibilidade.",
    },
    {
      id: "quebra-umidade",
      categoria: "agricultura",
      nome: "Quebra de Umidade",
      icone: Wheat,
      slug: "/ferramentas/quebra-umidade",
      objetivo: "Calcular o desconto comercial de peso sofrido pelos grãos (Soja, Milho, Trigo) quando entregues no armazém com umidade acima do padrão comercial (geralmente 14%).",
      campos: [
        "Peso bruto ou total da carga entregue no armazém (kg).",
        "Umidade medida na recepção (%).",
        "Umidade padrão exigida pelo contrato (geralmente 14%).",
      ],
      interpretacao: "Calcula a quebra real de umidade em quilos, informando o peso líquido final a ser faturado e o impacto financeiro dessa perda de umidade.",
    },
    {
      id: "rendimento-trator",
      categoria: "agricultura",
      nome: "Rendimento de Trator",
      icone: Settings,
      slug: "/ferramentas/rendimento-trator",
      objetivo: "Estimar a capacidade operacional diária de um conjunto trator-implemento em hectares por hora (ha/h) para planejamento de plantio, preparo de solo ou colheita.",
      campos: [
        "Largura efetiva de trabalho do implemento (metros).",
        "Velocidade média de deslocamento no talhão (km/h).",
        "Eficiência operacional esperada (considerando manobras, abastecimento, etc. - padrão 75%).",
      ],
      interpretacao: "Fornece o rendimento horário da operação e o tempo estimado para cobrir uma determinada área, otimizando o agendamento de máquinas na fazenda.",
    },
    {
      id: "perda-colheita",
      categoria: "agricultura",
      nome: "Perda na Colheita",
      icone: Wheat,
      slug: "/ferramentas/perda-colheita",
      objetivo: "Quantificar o desperdício de grãos deixados no solo pela colheitadeira por meio de amostragem física usando o método do aro ou copo medidor.",
      campos: [
        "Número de grãos coletados em um quadrado de 1m² ou área padrão.",
        "Cultura selecionada (Soja ou Milho) para cálculo de peso médio de grão.",
      ],
      interpretacao: "Calcula a perda de produtividade em sacas por hectare e o prejuízo financeiro correspondente, orientando se a colheitadeira precisa ser regulada (velocidade do molinete, rotação do cilindro ou abertura do côncavo).",
    },
    {
      id: "conversor-gps",
      categoria: "agricultura",
      nome: "Conversor de GPS",
      icone: Settings,
      slug: "/ferramentas/conversor-gps",
      objetivo: "Converter arquivos de coordenadas geográficas gerados em aplicativos e receptores de GPS comuns (como KML/GPX) para o formato Shapefile (.SHP) usado em computadores de bordo e mapas agrícolas.",
      campos: [
        "Upload de arquivos de formato .KML (Google Earth) ou .GPX (GPS Garmin).",
      ],
      interpretacao: "Gera um arquivo empacotado para download pronto para ser lido no QGIS, ArcGIS ou importado para o trator/pulverizador de agricultura de precisão.",
    },
    {
      id: "conversor-unidades",
      categoria: "agricultura",
      nome: "Conversor de Unidades",
      icone: Scale,
      slug: "/ferramentas/conversor-unidades",
      objetivo: "Converter unidades de medidas agrícolas nacionais e internacionais (como Alqueires Paulista/Mineiro/Baiano para Hectares, Bushels para sacas, Libras para quilos).",
      campos: [
        "Valor numérico a converter.",
        "Unidade de origem e unidade de destino correspondentes.",
      ],
      interpretacao: "Exibe a conversão exata conforme as normas de padronização, facilitando a interpretação de cotações internacionais e negociações de terras em diferentes regiões.",
    },

    // Pecuária
    {
      id: "volume-silo",
      categoria: "pecuaria",
      nome: "Volume de Silo",
      icone: Warehouse,
      slug: "/ferramentas/volume-silo",
      objetivo: "Calcular a capacidade de armazenamento de silos do tipo trincheira, encosto ou bolsa para garantir o planejamento nutricional do rebanho durante o período de seca.",
      campos: [
        "Dimensões físicas do silo (largura, comprimento, profundidade ou diâmetro).",
        "Densidade da silagem compactada (kg/m³ - padrão varia de 550 a 650 kg/m³).",
      ],
      interpretacao: "Fornece a capacidade total de armazenamento em toneladas métricas e estima por quantos dias essa reserva alimentará um rebanho de determinado tamanho.",
    },
    {
      id: "quadrado-pearson",
      categoria: "pecuaria",
      nome: "Balanceador (Pearson)",
      icone: Dna,
      slug: "/ferramentas/quadrado-pearson",
      objetivo: "Formular rações animais simples usando duas fontes nutricionais (uma proteica e uma energética) para atingir um teor específico de Proteína Bruta (PB).",
      campos: [
        "Teor de proteína bruto desejado na ração final (%).",
        "Teores de proteína dos dois ingredientes (ex: Milho 9% e Farelo de Soja 45%).",
      ],
      interpretacao: "Calcula a porcentagem e a quantidade em quilos de cada ingrediente que devem ser misturadas para produzir a ração com a nutrição exata exigida.",
    },
    {
      id: "suporte-pastagem",
      categoria: "pecuaria",
      nome: "Suporte de Pastagem",
      icone: Sprout,
      slug: "/ferramentas/suporte-pastagem",
      objetivo: "Calcular a capacidade de suporte (lotação) de uma pastagem em Unidades Animais por hectare (UA/ha) com base na massa de forragem disponível, evitando o superpastoreio.",
      campos: [
        "Massa de forragem fresca amostrada por m².",
        "Teor de Matéria Seca da pastagem (%).",
        "Período de pastejo (dias) e taxa de perdas por pisoteio.",
      ],
      interpretacao: "Informa o número máximo de animais (vacas/bois) que o piquete consegue sustentar de forma sustentável, mantendo a produtividade do capim a longo prazo.",
    },
    {
      id: "rendimento-carcaca",
      categoria: "pecuaria",
      nome: "Rendimento de Carcaça",
      icone: TrendingUp,
      slug: "/ferramentas/rendimento-carcaca",
      objetivo: "Simular o rendimento do animal após o abate no frigorífico, comparando o peso vivo na fazenda com o peso da carcaça limpa obtida em arrobas (@) e faturamento líquido.",
      campos: [
        "Peso vivo do animal na fazenda (kg).",
        "Rendimento de carcaça esperado (% - padrão de 50% a 55%).",
        "Cotação da arroba (@) em reais paga no dia.",
      ],
      interpretacao: "Fornece a quantidade final de arrobas (@) comercializáveis por animal e o valor total bruto a receber, facilitando a decisão de venda para abate.",
    },
    {
      id: "gestacao-vacas",
      categoria: "pecuaria",
      nome: "Gestão Gestacional Vacas",
      icone: Calendar,
      slug: "/ferramentas/gestacao-vacas",
      objetivo: "Monitorar a reprodução do rebanho leiteiro ou de corte, calculando a previsão exata de parto, data recomendada para a secagem da vaca e cronograma de vacinação.",
      campos: [
        "Data da Inseminação Artificial ou Cobertura.",
        "Duração média da gestação (padrão de 283 dias).",
      ],
      interpretacao: "Apresenta um cronograma claro de manejo reprodutivo (quando secar a vaca para descanso da glândula mamária, aplicar vacinas de pré-parto e preparo de dieta).",
    },

    // Gestão Financeira
    {
      id: "depreciacao-maquinas",
      categoria: "financeira",
      nome: "Depreciação de Máquinas",
      icone: Settings,
      slug: "/ferramentas/depreciacao-maquinas",
      objetivo: "Calcular o custo de depreciação anual, mensal e o custo de uso por hora de tratores e colheitadeiras para inclusão no fluxo de caixa e custos de produção real.",
      campos: [
        "Valor de compra inicial (novo ou usado).",
        "Vida útil estimada (anos ou total de horas).",
        "Valor residual de revenda (geralmente de 10% a 20% do valor inicial).",
      ],
      interpretacao: "Evidencia o custo real invisível do desgaste das máquinas, permitindo guardar provisões para renovação de frota no futuro.",
    },
    {
      id: "ponto-equilibrio",
      categoria: "financeira",
      nome: "Ponto de Equilíbrio",
      icone: Scale,
      slug: "/ferramentas/ponto-equilibrio",
      objetivo: "Determinar a produtividade mínima (sacas por hectare) e o faturamento mínimo necessários para cobrir todos os custos operacionais (fixos e variáveis) de uma safra.",
      campos: [
        "Custo fixo por hectare (arrendamento, folha de pagamento, administrativo).",
        "Custo variável por hectare (defensivos, adubos, sementes, combustível).",
        "Preço estimado de venda da saca da cultura.",
      ],
      interpretacao: "Calcula a margem de contribuição e a produção de equilíbrio (sc/ha). Se a produtividade estimada for menor que o ponto de equilíbrio, a safra dará prejuízo.",
    },
    {
      id: "simulador-barter",
      categoria: "financeira",
      nome: "Simulador de Barter",
      icone: Coins,
      slug: "/ferramentas/simulador-barter",
      objetivo: "Avaliar se compensa fechar um contrato de Barter (troca de insumos por grãos futuros com preço travado) ou comprar os insumos via canais tradicionais (financiamento/à vista).",
      campos: [
        "Custo do pacote de insumos e preço garantido da saca no barter.",
        "Taxa de juros do crédito bancário e preço esperado do grão no mercado físico na colheita.",
      ],
      interpretacao: "Aponta qual modalidade exige o menor comprometimento da colheita em volume de sacas físicas, economizando recursos da propriedade.",
    },
    {
      id: "planejador-compras",
      categoria: "financeira",
      nome: "Planejador de Compras",
      icone: PiggyBank,
      slug: "/ferramentas/planejador-compras",
      objetivo: "Analisar se vale mais a pena comprar insumos à vista (com desconto) ou a prazo, considerando o custo de oportunidade de manter o capital aplicado no CDI.",
      campos: [
        "Valor a prazo, desconto à vista oferecido, prazo em dias e rentabilidade da aplicação (CDI).",
      ],
      interpretacao: "Mapeia a taxa de juros implícita do fornecedor e compara com o CDI. Se os juros implícitos do prazo forem maiores que a rentabilidade do CDI, a compra à vista compensa.",
    },
    {
      id: "transicao-organicos",
      categoria: "financeira",
      nome: "Transição Orgânica",
      icone: Leaf,
      slug: "/ferramentas/transicao-organicos",
      objetivo: "Projetar a viabilidade financeira e o tempo de retorno (payback) do processo de conversão de uma lavoura convencional para o sistema orgânico ou certificado.",
      campos: [
        "Investimento inicial de conversão e anos de transição regulatória (MAPA).",
        "Produtividades, preços e custos operacionais de cada fase (convencional, transição e orgânica).",
      ],
      interpretacao: "Fornece o payback exato em anos e o lucro diferencial acumulado no 5º ano após o amortecimento dos anos de transição.",
    },
  ];

  const calculadorasFiltradas = calculadoras.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.objetivo.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-50/50 flex flex-col">
      <Header />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-10 flex-1">
        
        {/* Banner de Boas-vindas */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <HelpCircle className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Como utilizar as Calculadoras</h1>
          <p className="text-sm text-neutral-500 mt-2">
            Explore abaixo o guia passo a passo completo, objetivos e manual de interpretação para cada uma das ferramentas disponíveis no Talhão Digital.
          </p>

          {/* Barra de busca */}
          <div className="mt-6 relative max-w-md mx-auto">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar calculadora ou objetivo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
        </div>

        {/* ============================================================== */}
        {/* CATEGORIA: AGRICULTURA                                         */}
        {/* ============================================================== */}
        <div className="mb-12">
          <div className="border-b border-neutral-200 pb-3 mb-6">
            <h2 className="text-xl font-extrabold text-neutral-800 flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-600" />
              Calculadoras de Agricultura
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {calculadorasFiltradas
              .filter(c => c.categoria === "agricultura")
              .map(c => {
                const Icon = c.icone;
                return (
                  <div key={c.id} id={c.id} className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm scroll-mt-20 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="p-1.5 bg-emerald-50 text-emerald-850 rounded-lg">
                          <Icon className="w-4 h-4" />
                        </div>
                        <h3 className="font-extrabold text-neutral-850 text-sm">{c.nome}</h3>
                      </div>
                      <p className="text-xs text-neutral-600 leading-relaxed mb-4">{c.objetivo}</p>

                      <div className="space-y-3 mb-6">
                        <div>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Campos Principais:</span>
                          <ul className="list-disc pl-4 text-xs text-neutral-500 space-y-1 mt-1">
                            {c.campos.map((campo, i) => (
                              <li key={i}>{campo}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Tomada de Decisão:</span>
                          <p className="text-xs text-neutral-500 leading-relaxed mt-1">{c.interpretacao}</p>
                        </div>
                      </div>
                    </div>

                    <Link href={c.slug} className="w-full inline-flex justify-center items-center py-2 px-4 bg-emerald-50 text-emerald-850 hover:bg-emerald-100/70 rounded-xl text-xs font-bold transition-colors">
                      Acessar Calculadora <ArrowRight className="w-3 h-3 ml-1.5" />
                    </Link>
                  </div>
                );
              })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* CATEGORIA: PECUÁRIA                                            */}
        {/* ============================================================== */}
        <div className="mb-12">
          <div className="border-b border-neutral-200 pb-3 mb-6">
            <h2 className="text-xl font-extrabold text-neutral-800 flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-emerald-600" />
              Calculadoras de Pecuária
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {calculadorasFiltradas
              .filter(c => c.categoria === "pecuaria")
              .map(c => {
                const Icon = c.icone;
                return (
                  <div key={c.id} id={c.id} className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm scroll-mt-20 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="p-1.5 bg-emerald-50 text-emerald-850 rounded-lg">
                          <Icon className="w-4 h-4" />
                        </div>
                        <h3 className="font-extrabold text-neutral-850 text-sm">{c.nome}</h3>
                      </div>
                      <p className="text-xs text-neutral-600 leading-relaxed mb-4">{c.objetivo}</p>

                      <div className="space-y-3 mb-6">
                        <div>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Campos Principais:</span>
                          <ul className="list-disc pl-4 text-xs text-neutral-500 space-y-1 mt-1">
                            {c.campos.map((campo, i) => (
                              <li key={i}>{campo}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Tomada de Decisão:</span>
                          <p className="text-xs text-neutral-500 leading-relaxed mt-1">{c.interpretacao}</p>
                        </div>
                      </div>
                    </div>

                    <Link href={c.slug} className="w-full inline-flex justify-center items-center py-2 px-4 bg-emerald-50 text-emerald-850 hover:bg-emerald-100/70 rounded-xl text-xs font-bold transition-colors">
                      Acessar Calculadora <ArrowRight className="w-3 h-3 ml-1.5" />
                    </Link>
                  </div>
                );
              })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* CATEGORIA: GESTÃO FINANCEIRA                                   */}
        {/* ============================================================== */}
        <div className="mb-12">
          <div className="border-b border-neutral-200 pb-3 mb-6">
            <h2 className="text-xl font-extrabold text-neutral-800 flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-600" />
              Calculadoras de Gestão Financeira
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {calculadorasFiltradas
              .filter(c => c.categoria === "financeira")
              .map(c => {
                const Icon = c.icone;
                return (
                  <div key={c.id} id={c.id} className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm scroll-mt-20 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="p-1.5 bg-emerald-50 text-emerald-850 rounded-lg">
                          <Icon className="w-4 h-4" />
                        </div>
                        <h3 className="font-extrabold text-neutral-850 text-sm">{c.nome}</h3>
                      </div>
                      <p className="text-xs text-neutral-600 leading-relaxed mb-4">{c.objetivo}</p>

                      <div className="space-y-3 mb-6">
                        <div>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Campos Principais:</span>
                          <ul className="list-disc pl-4 text-xs text-neutral-500 space-y-1 mt-1">
                            {c.campos.map((campo, i) => (
                              <li key={i}>{campo}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Tomada de Decisão:</span>
                          <p className="text-xs text-neutral-500 leading-relaxed mt-1">{c.interpretacao}</p>
                        </div>
                      </div>
                    </div>

                    <Link href={c.slug} className="w-full inline-flex justify-center items-center py-2 px-4 bg-emerald-50 text-emerald-850 hover:bg-emerald-100/70 rounded-xl text-xs font-bold transition-colors">
                      Acessar Calculadora <ArrowRight className="w-3 h-3 ml-1.5" />
                    </Link>
                  </div>
                );
              })}
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}
