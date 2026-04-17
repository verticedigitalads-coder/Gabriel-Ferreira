import type { UnidadeOrcamento } from '@/types';

interface ItemCalculo {
  quantidade: number;
  valorUnitario: number;
  unitType?: UnidadeOrcamento;
  largura?: number;
  altura?: number;
}

interface CalculoParams {
  itens: ItemCalculo[];
  multiplicador: number;
  desconto?: number;
  percentualComissao?: number;
}

export function calcularItemTotal(item: ItemCalculo): number {
  if (item.unitType === 'm2' && item.largura && item.altura) {
    return item.largura * item.altura * item.valorUnitario * item.quantidade;
  }
  return item.quantidade * item.valorUnitario;
}

export function calcularOrcamento({
  itens,
  multiplicador,
  desconto = 0,
  percentualComissao = 0,
}: CalculoParams) {
  const subtotal = itens.reduce(
    (sum, item) => sum + calcularItemTotal(item),
    0,
  );

  const totalBruto = subtotal * multiplicador;
  const maoDeObra = totalBruto - subtotal;
  const comissao = percentualComissao > 0 ? totalBruto * (percentualComissao / 100) : 0;
  const total = totalBruto + comissao - desconto;

  return {
    subtotal,
    maoDeObra,
    comissao,
    total,
  };
}
