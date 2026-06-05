/// <reference types="vite/client" />

// vite-env.d.ts — Apenas "avisos de tipo" para o TypeScript.
// Em linguagem simples: este arquivo nao roda no jogo; ele so conta ao
// TypeScript sobre coisas que existem por fora do codigo, para o editor nao
// reclamar. A linha acima carrega os tipos do Vite (o nosso empacotador).

/** Valor injetado na hora de gerar a build pelo Vite (`define` em vite.config.ts).
 *  E o SHA curto do commit + a data da build, ex.: "a1b2c3d - 2026-06-04". */
declare const __BUILD_ID__: string;
