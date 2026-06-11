/**
 * ArrivalModal — o beat de chegada de um sobrevivente resgatado.
 *
 * Aparece ao voltar pro hub depois de uma run que resgatou alguém: mostra o
 * personagem (glifo + cores), a fala de chegada, e o que a presença dele
 * destrava no bunker (sala + zona nova). É o momento em que o jogador SENTE
 * o bunker crescer — por isso modal, e não toast.
 */
import { Graphics, Text } from 'pixi.js';
import { Modal } from '../Modal';
import { PixiButton } from '../PixiButton';
import { Color } from '../../core/Color';
import { FontFamily, TextColor } from '../../core/typography';
import { HubData } from '../../state/HubData';
import { audioManager } from '../../core/AudioManager';
import type { RescueLink } from '../../state/StoryProgress';

export class ArrivalModal extends Modal {
  constructor(link: RescueLink) {
    super(320, 400);
    const npc = HubData.getNpc(link.charId);
    const accent = npc ? Color.hex(npc.accent) : 0xb573d8;
    const body = npc ? Color.hex(npc.color) : 0xffffff;
    this.borderColor = accent;
    this.drawPanelBg(accent);

    const halfH = this.panelH / 2;
    const pad = 20;

    const tag = new Text({
      text: '— SOBREVIVENTE NO BUNKER —',
      style: { fontFamily: FontFamily.mono, fontSize: 10, fill: TextColor.muted, letterSpacing: 2, align: 'center' },
    });
    tag.anchor.set(0.5, 0);
    tag.y = -halfH + 26;
    this.panel.addChild(tag);

    // Retrato: glifo do personagem num anel com a cor dele.
    const portrait = new Graphics();
    portrait.circle(0, 0, 34).fill({ color: body, alpha: 0.18 }).stroke({ color: accent, width: 2, alpha: 0.9 });
    portrait.y = -halfH + 92;
    this.panel.addChild(portrait);
    const glyph = new Text({
      text: npc?.glyph ?? '?',
      style: { fontFamily: FontFamily.display, fontSize: 30, fontWeight: '700', fill: body },
    });
    glyph.anchor.set(0.5);
    glyph.y = -halfH + 92;
    this.panel.addChild(glyph);

    const name = new Text({
      text: `${npc?.nome ?? link.charId}  ·  ${npc?.hint ?? ''}`,
      style: { fontFamily: FontFamily.display, fontSize: 18, fontWeight: '700', fill: body, letterSpacing: 1, align: 'center' },
    });
    name.anchor.set(0.5, 0);
    name.y = -halfH + 140;
    this.panel.addChild(name);

    const quote = new Text({
      text: link.arrivalQuote,
      style: { fontFamily: FontFamily.body, fontSize: 13, fill: TextColor.white, fontStyle: 'italic', align: 'center', wordWrap: true, wordWrapWidth: this.panelW - pad * 2 },
    });
    quote.anchor.set(0.5, 0);
    quote.y = -halfH + 176;
    this.panel.addChild(quote);

    const unlock = new Text({
      text: link.unlockLine,
      style: { fontFamily: FontFamily.mono, fontSize: 12, fill: accent, align: 'center', wordWrap: true, wordWrapWidth: this.panelW - pad * 2, lineHeight: 18 },
    });
    unlock.anchor.set(0.5, 0);
    unlock.y = -halfH + 236;
    this.panel.addChild(unlock);

    const ok = new PixiButton({
      label: 'Bem-vindo ao bunker',
      width: 190, height: 38,
      textColor: accent,
      onClick: () => { void this.requestClose(); },
    });
    ok.x = -95;
    ok.y = halfH - 58;
    this.panel.addChild(ok);

    audioManager.playSfx('res://assets/audio/sfx/game/powerup.wav', 0.6);
    void this.animateOpen();
  }
}
