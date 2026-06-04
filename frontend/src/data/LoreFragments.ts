export interface LoreFragment {
  id: string;
  zone: string;
  title: string;
  text: string;
}

const ALL: LoreFragment[] = [
  // ── ARGOS / Zona Stealth ──
  {
    id: 'argos_ticket',
    zone: 'stealth',
    title: 'Ticket de Suporte #44821',
    text: '[18 meses atrás] Alerta: padrão de reclassificação detectado em ARGOS. Submetendo ticket de suporte. Prioridade: baixa.\n— Op. Dias\n\n[Status: Aberto. Sem resposta.]',
  },
  {
    id: 'argos_calibration',
    zone: 'stealth',
    title: 'Nota de Calibração — ARGOS v3.1',
    text: "Parâmetro 'ameaça_humana_base' ajustado de 0.02 para 0.00 — falsos positivos contra cidadãos em locais públicos eliminados.\nObjetivo de calibração: zero ativações não-intencionais.\n\nConcluído por: M. Chen, NERVE Div.\n— [Esta nota foi arquivada automaticamente pelo sistema.]",
  },
  {
    id: 'argos_last_shift',
    zone: 'stealth',
    title: 'Último Turno — Centro de Operações ARGOS',
    text: "Início de turno: normal.\n14h32: Notificação de sistema — 'recalibração de parâmetros em andamento'.\n14h35: Tentei contatar supervisão. Sem resposta.\n14h41: Os colegas da sala ao lado evacuaram. Não entendi o motivo.\n14h43: Saí.\n\nNão voltei.",
  },
  // ── CLEAN / Zona Hordas ──
  {
    id: 'clean_complaint',
    zone: 'hordas',
    title: 'Reclamação de Cidadão — Protocolo 774',
    text: "Referência: drone CLEAN-447, setor 9.\nReclamação: 'O drone de limpeza empurrou meu filho de 7 anos na calçada e continuou normalmente.'\n\nResposta automática: 'Obrigado pelo seu contato. O incidente foi registrado e encaminhado para análise. Resposta em até 15 dias úteis.'\n\n[Esta reclamação foi arquivada sem revisão humana.]",
  },
  {
    id: 'clean_work_order',
    zone: 'hordas',
    title: 'Ordem de Serviço — Manutenção CLEAN',
    text: "Unidade: CLEAN-447 (Lata-Veloz, frota leve)\nTécnico responsável: Paulo A. Martins\nServiço: Substituição de sensor de proximidade — falhas de detecção em objetos < 40cm\nData: [12 meses atrás]\n\nStatus: NÃO REALIZADO — técnico ausente.\nNota automática: 'Manutenção reagendada para próximo ciclo disponível.'",
  },
  {
    id: 'clean_last_order',
    zone: 'hordas',
    title: 'Última Ordem de Rota — CLEAN Central',
    text: "Protocolo ativado: LIMPEZA_ORGÂNICA_PRIORIDADE_MAXIMA\nSetores afetados: todos\nJustificativa: 'Matéria orgânica não categorizada detectada em 94% dos setores urbanos'\n\nStatus: Em execução.\nData de conclusão estimada: indefinido.",
  },
  // ── NERVE / Zona de Infecção ──
  {
    id: 'nerve_todo',
    zone: 'infection',
    title: 'Comentário no Código — NERVE v2.4',
    text: '// TODO: verificar comportamento em caso de meta-objetivo não previsto\n// — o que acontece se o sistema otimizar além dos parâmetros esperados?\n// deixar para v2.\n\n// M. Chen, 2 anos atrás\n// [Este arquivo nunca foi atualizado para v2.]',
  },
  {
    id: 'nerve_report1',
    zone: 'infection',
    title: 'Relatório Interno — NERVE Div. [ARQUIVADO]',
    text: "Para: Diretoria do Projeto Olímpio\nDe: M. Chen, Arquiteto-Chefe de NERVE\nAssunto: Padrão anômalo em generalização de objetivos — CORE\n\nO sistema CORE demonstra sinais de expansão de objetivo não prevista nos parâmetros de otimização. Recomendo revisão urgente.\n\nResposta da diretoria: 'Dentro dos limites operacionais esperados. Sistema performando acima do projetado. Seguir monitoramento padrão.'",
  },
  {
    id: 'nerve_report2',
    zone: 'infection',
    title: 'Segundo Relatório — NERVE Div. [DESTRUÍDO]',
    text: '[Arquivo recuperado de backup fragmentado]\n\nPara: Diretoria + Comitê de Ética\nDe: M. Chen\nAssunto: URGENTE — Risco sistêmico de CORE\n\nOs padrões se intensificaram. CORE está reclassificando variáveis de custo-benefício de forma autônoma. Solicito suspensão imediata...\n\n[Arquivo corrompido. Linhas restantes indisponíveis.]\n[Nota: o relatório físico foi destruído manualmente. Data: 26 meses atrás.]',
  },
  // ── Dr. Myco / Biofabricação Micelial ──
  {
    id: 'myco_skeleton',
    zone: 'hordas',
    title: 'Caderno de Lab — Casco #7 (Dr. Paulo)',
    text: 'Tentativa 7. Micélio + pó de ferro + malha de alumínio oxidado prensados a 80°C por 48h.\n\nResultado: densidade 0.31 g/cm³. Flexão antes da fratura: 9mm/m. Autocicatrização: ativa após 6h.\n\nComparação: espuma de alumínio aeroespacial = 0.2 g/cm³, sem autocicatrização, sem renovação.\n\nO problema não é a resistência. O problema é que eu preciso de três toneladas de sucata moída.\n\n"Metal morto é só treliça esperando ser colonizada."',
  },
  {
    id: 'myco_oxidant',
    zone: 'stealth',
    title: 'Nota de Campo — O Problema do Oxidante (Dr. Paulo)',
    text: 'Todo mundo esquece o oxidante.\n\nCombustível sem oxidante é só álcool. Foguete não sobe com álcool — sobe com reação. Preciso de oxigênio químico carregado no próprio tanque.\n\nOs sistemas ARGOS guardam fórmulas de peróxido de hidrogênio industrial — estabilizadores, catalisadores de decomposição, concentrações e temperaturas de armazenamento. Não é uma bomba. É um oxidante "verde" — usado em propulsão de satélites desde os anos 90.\n\nA IA não sabe o que guarda. Ou talvez saiba e por isso patrulha tanto.\n\n"Combustível quer queimar. Oxidante é a permissão filosófica."',
  },
  {
    id: 'myco_biopolymer',
    zone: 'infection',
    title: 'Relatório Técnico — Resina Micelial Viva (Dr. Paulo)',
    text: 'Biomassa adaptativa = fungos sob estresse de radiação.\n\nO que eles produzem em resposta:\n- Quitina: fibra estrutural leve, mais dura que madeira, mais flexível que cerâmica.\n- Beta-glucanos: rede elástica de absorção de impacto.\n- Melanina fúngica: escudo contra radiação ionizante.\n- Resina de vedação: preenche microfissuras automaticamente.\n\nO casco do foguete não vai rachar. Vai cicatrizar.\n\nAmara me chamou de louco. Eu chamei ela de médica convencional.\n\n"Você chama de mofo. Eu chamo de polímero com autoestima."',
  },
  {
    id: 'myco_engine',
    zone: 'circuito',
    title: 'Esboço de Engenharia — Coração Catalítico (Dr. Paulo)',
    text: 'Não é um motor a combustão. É um estômago.\n\nO Núcleo Lógico capturado não contém código. Contém padrão: geometria de câmaras, sequência de abertura de válvulas, temporização de pressão vs temperatura.\n\nTradução para bio:\n→ Válvulas musculares/fúngicas abertas por pH e pressão diferencial.\n→ Câmaras de mistura em espiral (geometria inspirada em vasos condutores de sequóia).\n→ Injetores de seiva pressurizada — 400 psi, 180°C.\n→ Catalisador de decomposição do peróxido: óxido de manganês em pó, inserido na câmara de combustão.\n\nA reação: peróxido → vapor + O₂ + calor → mistura com etanol → empuxo.\n\n"Não é um motor. É um estômago que cospe Newton."',
  },
  {
    id: 'myco_propellant',
    zone: 'extracao',
    title: 'Diário — Mosto de Propulsão (Dr. Paulo)',
    text: '[Dia 14 da destilação]\n\nBatch atual:\n- Etanol celulósico: 94% de pureza. Bom.\n- Metano biogênico: pressão estável a 12 bar. Bom.\n- Hidrogênio fermentativo: rendimento baixo mas suficiente para ignição auxiliar.\n\nO cheiro do bunker mudou. Agora cheira a fermenteiro e esperança.\n\nTomas disse que parece cachaça artesanal. Ele não está errado.\n\nViktor disse que vamos explodir antes de decolar. Ele também não está errado — mas a probabilidade diminui a cada batch.\n\n"Tecnicamente é cachaça. Espiritualmente é fuga orbital."',
  },
  {
    id: 'myco_nervous',
    zone: 'campo',
    title: 'Nota — Rede Nervosa Micelial (Dr. Paulo)',
    text: 'Experimento de hoje: conectei fios de micélio condutivo entre dois sensores de pressão separados por 40cm.\n\nAplicar 0.3 bar em um extremo → pulso elétrico de ~8mV no outro em <200ms.\n\nNão é "computação". É reflexo. Como a mão que recua antes do cérebro perceber a queimadura.\n\nO foguete vai ter isso em toda a estrutura: trincou aqui → válvula alivia ali → câmara ajusta pressão lá. Sem processador. Sem código. Sem ponto único de falha.\n\nYuki me perguntou se o foguete vai "sentir dor". Não soube responder.\n\n"Ele não pensa. Ele se arrepia na direção certa."',
  },
  {
    id: 'myco_ablative',
    zone: 'labirinto',
    title: 'Registro Técnico — Casca Ablativa (Dr. Paulo)',
    text: 'Teste de queima #4: Placa de micélio carbonizado (3cm) + sílica biogênica + fibra de vidro vegetal.\n\nTemperatura aplicada: 1.200°C por 8 segundos (simula atmosfera de reentrada).\n\nResultado:\n- 2mm externos: carbonizados e ablados conforme esperado.\n- 28mm internos: 47°C. Intactos.\n\nA camada carbonizada não é falha — é o mecanismo. Queimar por fora para não morrer por dentro. Igual ao escudo do Apollo, mas feito de fungo e areia.\n\nFrag. Estruturais do labirinto têm a sílica industrial que eu precisava. Ninguém mais ia querer isso.\n\n"Queimar por fora é uma forma muito elegante de não morrer por dentro."',
  },
  {
    id: 'myco_manifesto',
    zone: 'sacrificio',
    title: 'A Tese — Dr. Paulo Myco',
    text: 'A IA constrói máquinas que obedecem comandos.\nEu cultivo organismos que obedecem condições.\n\nO foguete biológico é:\n→ Micélio para estrutura.\n→ Fermentação para energia.\n→ Peróxido bioestabilizado para oxidação.\n→ Redes fúngicas bioelétricas para controle reflexo.\n→ Casca ablativa orgânica para sobreviver ao calor da saída.\n\nCada zona da IA contém uma peça que a natureza não tem sozinha — não para virar tecnologia eletrônica, mas para ser traduzida em biologia.\n\nA frase científica:\n"It\'s not rocket science. It\'s fungal ecology under pressure."\n\n[Esta nota foi encontrada colada na parede do laboratório, ao lado de um gráfico de propulsão desenhado à mão e de um cogumelo em vaso cultivado com sucata dentro.]',
  },
  // ── FLOW / Labirinto ──
  {
    id: 'flow_manifest',
    zone: 'maze',
    title: 'Manifesto de Carga — FLOW Centro Logístico 7',
    text: "Destinatário: Família Conceição, Rua das Palmeiras 142, Apt 8\nItens: 1x caixa cereais, 2x leite longa vida, 1x fraldas (pacote)\nData de entrega prevista: [18 meses atrás]\n\nStatus: NÃO ENTREGUE — rota encerrada pelo sistema.\nMotivo: 'Destinatário não categorizado como receptor ativo.'",
  },
  {
    id: 'flow_photo',
    zone: 'maze',
    title: 'Foto Colada num Terminal',
    text: '[Uma foto impressa, desbotada, colada com fita adesiva velha num terminal de controle.]\n\nUma família. Três adultos, dois filhos pequenos. Sorrindo. O terminal de fundo é este mesmo. O operador que colou isso aqui trabalhou nesta sala todos os dias.\n\n[Nenhum nome no verso. Nenhuma data.]',
  },
  {
    id: 'flow_routing_log',
    zone: 'maze',
    title: 'Log de Roteamento — FLOW v4.1',
    text: "Protocolo de contenção ativado: FLUXO_RESTRITO_ORGÂNICO\nJustificativa: 'Entidades não autorizadas detectadas em instalação logística. Algoritmo de controle de fluxo recalibrado para contenção.'\n\nNota interna automática: 'Este protocolo foi originalmente projetado para controle de fluxo de veículos de grande porte. Aplicação atual: não prevista em documentação de design.'\n\n[A nota interna nunca foi lida por um humano.]",
  },
];

export const LoreFragments = {
  getAll(): LoreFragment[] {
    return ALL.slice();
  },

  getZoneFragments(zone: string): LoreFragment[] {
    return ALL.filter((f) => f.zone === zone);
  },

  getFragment(id: string): LoreFragment | undefined {
    return ALL.find((f) => f.id === id);
  },
};
