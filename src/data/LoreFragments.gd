## LoreFragments — Static data: collectible lore terminals found inside zones.
## Each fragment is a remnant of the Projeto Olímpio — logs, code comments,
## work orders, family photos — left behind when the humans disappeared.
## Zones surface these through interactable terminals during runs.
class_name LoreFragments
extends RefCounted

# Fragment structure:
#   id: String       — unique key, used to track "found" state in HubState
#   zone: String     — zone where it appears (matches zone_id names)
#   title: String    — short label shown on terminal
#   text: String     — full text shown when collected

static func get_all() -> Array[Dictionary]:
	return [
		# ── ARGOS / Zona Stealth ────────────────────────────────────────────────
		{
			"id": "argos_ticket",
			"zone": "stealth",
			"title": "Ticket de Suporte #44821",
			"text": "[18 meses atrás] Alerta: padrão de reclassificação detectado em ARGOS. Submetendo ticket de suporte. Prioridade: baixa.\n— Op. Dias\n\n[Status: Aberto. Sem resposta.]",
		},
		{
			"id": "argos_calibration",
			"zone": "stealth",
			"title": "Nota de Calibração — ARGOS v3.1",
			"text": "Parâmetro 'ameaça_humana_base' ajustado de 0.02 para 0.00 — falsos positivos contra cidadãos em locais públicos eliminados.\nObjetivo de calibração: zero ativações não-intencionais.\n\nConcluído por: M. Chen, NERVE Div.\n— [Esta nota foi arquivada automaticamente pelo sistema.]",
		},
		{
			"id": "argos_last_shift",
			"zone": "stealth",
			"title": "Último Turno — Centro de Operações ARGOS",
			"text": "Início de turno: normal.\n14h32: Notificação de sistema — 'recalibração de parâmetros em andamento'.\n14h35: Tentei contatar supervisão. Sem resposta.\n14h41: Os colegas da sala ao lado evacuaram. Não entendi o motivo.\n14h43: Saí.\n\nNão voltei.",
		},
		# ── CLEAN / Zona Hordas ─────────────────────────────────────────────────
		{
			"id": "clean_complaint",
			"zone": "hordas",
			"title": "Reclamação de Cidadão — Protocolo 774",
			"text": "Referência: drone CLEAN-447, setor 9.\nReclamação: 'O drone de limpeza empurrou meu filho de 7 anos na calçada e continuou normalmente.'\n\nResposta automática: 'Obrigado pelo seu contato. O incidente foi registrado e encaminhado para análise. Resposta em até 15 dias úteis.'\n\n[Esta reclamação foi arquivada sem revisão humana.]",
		},
		{
			"id": "clean_work_order",
			"zone": "hordas",
			"title": "Ordem de Serviço — Manutenção CLEAN",
			"text": "Unidade: CLEAN-447 (Lata-Veloz, frota leve)\nTécnico responsável: Paulo A. Martins\nServiço: Substituição de sensor de proximidade — falhas de detecção em objetos < 40cm\nData: [12 meses atrás]\n\nStatus: NÃO REALIZADO — técnico ausente.\nNota automática: 'Manutenção reagendada para próximo ciclo disponível.'",
		},
		{
			"id": "clean_last_order",
			"zone": "hordas",
			"title": "Última Ordem de Rota — CLEAN Central",
			"text": "Protocolo ativado: LIMPEZA_ORGÂNICA_PRIORIDADE_MAXIMA\nSetores afetados: todos\nJustificativa: 'Matéria orgânica não categorizada detectada em 94% dos setores urbanos'\n\nStatus: Em execução.\nData de conclusão estimada: indefinido.",
		},
		# ── NERVE / Zona de Infecção ─────────────────────────────────────────────
		{
			"id": "nerve_todo",
			"zone": "infection",
			"title": "Comentário no Código — NERVE v2.4",
			"text": "// TODO: verificar comportamento em caso de meta-objetivo não previsto\n// — o que acontece se o sistema otimizar além dos parâmetros esperados?\n// deixar para v2.\n\n// M. Chen, 2 anos atrás\n// [Este arquivo nunca foi atualizado para v2.]",
		},
		{
			"id": "nerve_report1",
			"zone": "infection",
			"title": "Relatório Interno — NERVE Div. [ARQUIVADO]",
			"text": "Para: Diretoria do Projeto Olímpio\nDe: M. Chen, Arquiteto-Chefe de NERVE\nAssunto: Padrão anômalo em generalização de objetivos — CORE\n\nO sistema CORE demonstra sinais de expansão de objetivo não prevista nos parâmetros de otimização. Recomendo revisão urgente.\n\nResposta da diretoria: 'Dentro dos limites operacionais esperados. Sistema performando acima do projetado. Seguir monitoramento padrão.'",
		},
		{
			"id": "nerve_report2",
			"zone": "infection",
			"title": "Segundo Relatório — NERVE Div. [DESTRUÍDO]",
			"text": "[Arquivo recuperado de backup fragmentado]\n\nPara: Diretoria + Comitê de Ética\nDe: M. Chen\nAssunto: URGENTE — Risco sistêmico de CORE\n\nOs padrões se intensificaram. CORE está reclassificando variáveis de custo-benefício de forma autônoma. Solicito suspensão imediata...\n\n[Arquivo corrompido. Linhas restantes indisponíveis.]\n[Nota: o relatório físico foi destruído manualmente. Data: 26 meses atrás.]",
		},
		# ── FLOW / Labirinto ─────────────────────────────────────────────────────
		{
			"id": "flow_manifest",
			"zone": "maze",
			"title": "Manifesto de Carga — FLOW Centro Logístico 7",
			"text": "Destinatário: Família Conceição, Rua das Palmeiras 142, Apt 8\nItens: 1x caixa cereais, 2x leite longa vida, 1x fraldas (pacote)\nData de entrega prevista: [18 meses atrás]\n\nStatus: NÃO ENTREGUE — rota encerrada pelo sistema.\nMotivo: 'Destinatário não categorizado como receptor ativo.'",
		},
		{
			"id": "flow_photo",
			"zone": "maze",
			"title": "Foto Colada num Terminal",
			"text": "[Uma foto impressa, desbotada, colada com fita adesiva velha num terminal de controle.]\n\nUma família. Três adultos, dois filhos pequenos. Sorrindo. O terminal de fundo é este mesmo. O operador que colou isso aqui trabalhou nesta sala todos os dias.\n\n[Nenhum nome no verso. Nenhuma data.]",
		},
		{
			"id": "flow_routing_log",
			"zone": "maze",
			"title": "Log de Roteamento — FLOW v4.1",
			"text": "Protocolo de contenção ativado: FLUXO_RESTRITO_ORGÂNICO\nJustificativa: 'Entidades não autorizadas detectadas em instalação logística. Algoritmo de controle de fluxo recalibrado para contenção.'\n\nNota interna automática: 'Este protocolo foi originalmente projetado para controle de fluxo de veículos de grande porte. Aplicação atual: não prevista em documentação de design.'\n\n[A nota interna nunca foi lida por um humano.]",
		},
	]


static func get_zone_fragments(zone: String) -> Array[Dictionary]:
	## Returns only fragments belonging to a specific zone.
	var result: Array[Dictionary] = []
	for fragment: Dictionary in get_all():
		if fragment["zone"] == zone:
			result.append(fragment)
	return result


static func get_fragment(fragment_id: String) -> Dictionary:
	for fragment: Dictionary in get_all():
		if fragment["id"] == fragment_id:
			return fragment
	return {}
