import { useCallback } from 'react';
import { posicaoParaDesfazer, posicaoParaMaiuscula, type ModoMaiuscula } from '@/utils/maiusculaAuto';

type Campo = HTMLInputElement | HTMLTextAreaElement;

// Maiúscula automática ao digitar, para quem usa notebook (autoCapitalize só age no
// teclado do celular). Devolve uma callback ref; a mesma ref pode ir em vários campos.
// A troca usa execCommand: gera um input normal (o onChange recebe o valor já trocado),
// não move o cursor e vira um passo próprio do Ctrl+Z.
export function useMaiusculaAuto(modo?: ModoMaiuscula) {
  return useCallback(
    (el: Campo | null) => {
      if (!el || !modo) return;
      let corrigida = -1; // posição da última maiúscula que este campo colocou
      let veto = -1; // a pessoa apagou essa maiúscula: a próxima letra ali fica como digitada
      let ultimaTroca = -1; // posição da última letra trocada (maiúscula ou desfeita)
      let cursorDaTroca = -1; // onde o cursor estava nessa troca
      let trocando = false;

      const trocar = (pos: number, letra: string, cursor: number) => {
        trocando = true;
        el.setSelectionRange(pos, pos + 1);
        document.execCommand('insertText', false, letra);
        el.setSelectionRange(cursor, cursor);
        ultimaTroca = pos;
        cursorDaTroca = cursor;
        trocando = false;
      };

      const aplicar = () => {
        const valor = el.value;
        const cursor = el.selectionStart ?? -1;
        if (cursor < 1 || cursor !== el.selectionEnd) return;
        if (veto >= 0) {
          const vetada = veto === cursor - 1;
          veto = -1;
          if (vetada) return;
        }
        const p = posicaoParaMaiuscula(valor, cursor, modo);
        if (p >= 0) {
          trocar(p, valor[p].toLocaleUpperCase('pt-BR'), cursor);
          corrigida = p;
          return;
        }
        const d = posicaoParaDesfazer(valor, cursor, corrigida, modo);
        if (d >= 0) trocar(d, valor[d].toLocaleLowerCase('pt-BR'), cursor);
        // Palavra fechou (veio algo que não é letra): não há mais o que desfazer.
        if (valor[cursor - 1].toLocaleLowerCase('pt-BR') === valor[cursor - 1].toLocaleUpperCase('pt-BR')) corrigida = -1;
      };

      // Backspace que apaga só a maiúscula que o campo colocou (cursor logo depois dela).
      // Selecionar tudo e apagar não conta.
      const onBeforeInput = (e: Event) => {
        const ev = e as InputEvent;
        if (trocando || ev.inputType !== 'deleteContentBackward' || corrigida < 0) return;
        if (el.selectionStart === el.selectionEnd && el.selectionStart === corrigida + 1) veto = corrigida;
      };

      const onInput = (e: Event) => {
        const ev = e as InputEvent;
        if (trocando || ev.isComposing) return;
        if (ev.inputType === 'insertText' && ev.data?.length === 1) {
          aplicar();
          return;
        }
        if (ev.inputType === 'historyUndo') {
          // Ctrl+Z da troca: o navegador deixa a letra selecionada; o cursor volta para onde estava
          // (senão a próxima tecla apaga a letra ou cai no meio da palavra, no caso de "Da " ou "M²").
          if (ultimaTroca >= 0 && el.selectionStart === ultimaTroca && el.selectionEnd === ultimaTroca + 1) {
            el.setSelectionRange(cursorDaTroca, cursorDaTroca);
          }
          corrigida = veto = ultimaTroca = cursorDaTroca = -1;
          return;
        }
        if (ev.inputType.startsWith('delete')) {
          if ((el.selectionStart ?? -1) <= corrigida) corrigida = -1;
          return;
        }
        corrigida = veto = -1; // colar, recortar, arrastar
      };

      // Tecla morta / IME: a letra composta (´e → é) chega no fim da composição.
      // Espera o navegador terminar de soltar os eventos da composição antes de trocar.
      const onCompositionEnd = (e: Event) => {
        if ((e as CompositionEvent).data?.length === 1) setTimeout(() => el.isConnected && aplicar(), 0);
      };

      el.addEventListener('beforeinput', onBeforeInput);
      el.addEventListener('input', onInput);
      el.addEventListener('compositionend', onCompositionEnd);
      return () => {
        el.removeEventListener('beforeinput', onBeforeInput);
        el.removeEventListener('input', onInput);
        el.removeEventListener('compositionend', onCompositionEnd);
      };
    },
    [modo],
  );
}
