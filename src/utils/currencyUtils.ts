/**
 * Utilitários para formatação e leitura flexível de valores monetários (BRL / R$)
 */

export function parseCurrency(val: string | number): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val || typeof val !== 'string') return 0;
  
  const clean = val.replace(/[^\d.,]/g, '').trim();
  if (!clean) return 0;

  // Formato brasileiro com vírgula decimal: "1.500,50" ou "1500,50" ou "879,74"
  if (clean.includes(',')) {
    const parts = clean.split(',');
    const intPart = parts[0].replace(/\./g, '');
    const decPart = parts[1] ? parts[1].slice(0, 2) : '00';
    return parseFloat(`${intPart}.${decPart}`) || 0;
  }

  // Se tiver pontos
  if (clean.includes('.')) {
    const parts = clean.split('.');
    if (parts.length > 2) {
      // Múltiplos pontos de milhar: 1.000.000
      return parseFloat(parts.join('')) || 0;
    }
    // Um único ponto: pode ser milhar (ex: 1.000) ou decimal (ex: 15.50)
    if (parts[1] && parts[1].length === 3) {
      return parseFloat(parts[0] + parts[1]) || 0;
    }
    return parseFloat(clean) || 0;
  }

  return parseFloat(clean) || 0;
}

export function formatCurrencyBRL(val: number): string {
  if (isNaN(val)) return 'R$ 0,00';
  return val.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
