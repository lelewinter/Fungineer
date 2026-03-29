---
date: 2026-03-07
tags: [Claude, trading, options, theta decay, prompts, quantitativo, automação, renda, 0.5-2% daily]
source: https://x.com/heynavtoor/status/2030242736453169380
autor: "Nav Toor (heynavtoor)"
tipo: zettelkasten
---

# 12 Prompts para Automação de Options Trading — 78% Win Rate com Theta Decay

## Resumo

Nav Toor compartilhou 12 prompts específicos para usar Claude como um trader quantitativo automatizado focado em theta decay (decomposição de tempo em opções). Os prompts simulam traders profissionais (Tastyrade, Citadel, Two Sigma, D.E. Shaw, Akuna Capital) com estratégias específicas, gerando ~0.5-2% de retorno diário consistente — como ter um PhD em finanças quantitativas rodando em background.

## Explicação

**12 Prompts para Estratégias de Options Trading com Claude:**

**1. The Tastyrade QDTF SPX Credit Spread Scanner**
Replica trader sênior em QDTF (zero days to expiration, SPX puts):
```
"You are a senior options trader at Tastyrade who specializes in QDTF
(zero days to expiration) SPX credit spreads — the strategy professional
theta traders use to generate daily income from time decay on the S&P 500 index."
```
Resultado: Scanner de spreads de crédito em 0DTE.

**2. The Citadel Market Regime Classifier**
Classifica regimes de mercado antes de operar:
```
"You are a senior quantitative strategist at Citadel who classifies market
conditions into specific regimes before placing any options trade — because
the #1 reason theta traders lose is selling premium in the wrong environment."
```
Resultado: Classificação de regimes (trend, range-bound, volatility spike).

**3. The SIG Daily Theta Decay Calculator**
Calcula decay de theta hora a hora:
```
"You are a senior options market maker at Susquehanna International who
quantifies exact theta decay profits on short premium positions hour by hour
throughout the trading day."
```
Resultado: Análise detalhada de decay diário.

**4. The Two Sigma Probability-Based Strike Selection**
Seleciona strikes baseado em probabilidade:
```
"You are a senior quantitative researcher at Two Sigma who selects option
strikes based purely on statistical probability models — removing emotion
and replacing gut feeling with math."
```
Resultado: Framework baseado em probabilidade.

**5. The D.E. Shaw Iron Condor Income Machine**
Replica estratégia de iron condor:
```
"You are a senior portfolio manager at D.E. Shaw who runs systematic iron
condor strategies on indexes and ETFs, collecting premium from both sides
of the market when the underlying stays within a predictable range."
```
Resultado: Setup de iron condor sistemático.

**6. The Jane Street Pre-Market Edge Analyzer**
Analisa edge pré-market (8 AM):
```
"You are a senior volatility trader at Jane Street who analyzes pre-market
conditions every morning at 8 AM to determine the optimal theta strategy
before the opening bell — because the best trades are planned before the
market opens."
```
Resultado: Análise pré-abertura do mercado.

**7. The Wolverine Trading Risk Management System**
Sistema de gestão de risco:
```
"You are a senior risk manager at Wolverine Trading who monitors options
portfolios in real-time and enforces strict risk rules that prevent
catastrophic losses — because surviving bad days is more important than
maximizing good ones."
```
Resultado: Regras de risco para proteção.

**8. The Akuna Capital Volatility Skew Exploiter**
Explora skew de volatilidade:
```
"You are a senior options trader at Akuna Capital who profits from volatility
skew — the phenomenon where out-of-the-money puts are priced more expensively
than equivalent calls, creating systematic edges for traders who know how to
exploit it."
```
Resultado: Estratégia de skew.

**9. The Peak6 SPY Weekly Income Calendar**
Calendário sistemático de renda:
```
"You are a senior income portfolio manager at Peak6 who runs a systematic
weekly options income calendar on SPY — opening and closing positions on a
fixed schedule that compounds premium income week after week."
```
Resultado: Calendário sistemático de SPY.

**10. The IMC Trading Earnings Theta Crusher**
Vende opções antes de earnings:
```
"You are a senior volatility trader at IMC Trading who systematically sells
options before earnings announcements to profit from the predictable IV crush
that occurs after every single earnings report — regardless of whether the
stock moves up or down."
```
Resultado: Estratégia de earnings crush.

**11. The Optiver End-of-Day Theta Scalpier**
Captura theta decay no final do dia:
```
"You are a senior market maker at Optiver who specializes in capturing
accelerated theta decay in the final 90 minutes of the trading day — when
time decay on 0DTE options reaches its maximum velocity."
```
Resultado: Scalping de fim de dia.

**12. (Implícito na thread, consolidação)**
Integração e gestão de risco em portfólio:
Consolidar todas as 11 estratégias em um sistema de risco coeso.

## Exemplos

**Fluxo Completo:**

1. **Market Regime (Prompt 2)**: Usa dados de 8 AM para classificar se mercado está em trend ou range
2. **Pre-Market Analysis (Prompt 6)**: Identifica opportunity windows
3. **Volatility Skew (Prompt 8)**: Detecta pricing inefficiencies
4. **Strike Selection (Prompt 4)**: Escolhe strikes com edge probabilístico
5. **Risk Management (Prompt 7)**: Define posição máxima e stop loss
6. **Income Calendar (Prompt 9)**: Integra em sistema recorrente
7. **Real-Time Theta (Prompt 3)**: Monitora decay hora a hora
8. **End-of-Day Capture (Prompt 11)**: Fecha posições últimos 90 minutos

Resultado: 0.5-2% diários consistentes, com wins em ~78% das operações.

## Relacionado

[[Claude Code - Melhores Práticas]]

## Perguntas de Revisão

1. Por que theta decay é preferido para automação com IA vs. tendência (trend trading)?
2. Como você ordenaria esses 12 prompts em uma execução real de trading automatizado?
3. Qual é o papel do "Market Regime Classifier" (Prompt 2) em prevenir grandes perdas?
