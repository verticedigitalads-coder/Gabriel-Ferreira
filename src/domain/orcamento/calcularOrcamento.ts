interface CalculoParams {
  itens: {
    quantidade: number;
    valorUnitario: number;
  }[];
  multiplicador: number;
  desconto?: number;
}

export function calcularOrcamento({
  itens,
  multiplicador,
  desconto = 0,
}: CalculoParams) {
  const subtotal = itens.reduce(
    (sum, item) => sum + item.quantidade * item.valorUnitario,
    0,
  );

  const totalBruto = subtotal * multiplicador;
  const maoDeObra = totalBruto - subtotal;
  const total = totalBruto - desconto;

  return {
    subtotal,
    maoDeObra,
    total,
  };
}
