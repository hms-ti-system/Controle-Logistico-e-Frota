import { formatDateBR } from './formatters';

export type PeriodMode = 'current_month' | 'previous_month' | 'custom' | 'all';

export interface PeriodFilterState {
  mode: PeriodMode;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const getMonthNameBR = (monthNum: number): string => {
  return MONTH_NAMES[monthNum - 1] || '';
};

export const getCurrentMonthInfo = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const lastDay = new Date(year, month, 0).getDate();
  const monthStr = String(month).padStart(2, '0');
  const startDate = `${year}-${monthStr}-01`;
  const endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
  const monthName = getMonthNameBR(month);
  const label = `${monthName}/${year}`;
  const fullLabel = `Mês Atual (${label})`;
  return { year, month, startDate, endDate, monthName, label, fullLabel };
};

export const getPreviousMonthInfo = () => {
  const now = new Date();
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = prevDate.getFullYear();
  const month = prevDate.getMonth() + 1;
  const lastDay = new Date(year, month, 0).getDate();
  const monthStr = String(month).padStart(2, '0');
  const startDate = `${year}-${monthStr}-01`;
  const endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
  const monthName = getMonthNameBR(month);
  const label = `${monthName}/${year}`;
  const fullLabel = `Mês Anterior (${label})`;
  return { year, month, startDate, endDate, monthName, label, fullLabel };
};

export const getInitialPeriodFilter = (): PeriodFilterState => {
  const current = getCurrentMonthInfo();
  return {
    mode: 'current_month',
    startDate: current.startDate,
    endDate: current.endDate,
  };
};

export const isDateInPeriod = (dateStr: string, filter: PeriodFilterState): boolean => {
  if (filter.mode === 'all') return true;
  if (!dateStr) return false;

  if (filter.mode === 'current_month') {
    const current = getCurrentMonthInfo();
    return dateStr >= current.startDate && dateStr <= current.endDate;
  }

  if (filter.mode === 'previous_month') {
    const prev = getPreviousMonthInfo();
    return dateStr >= prev.startDate && dateStr <= prev.endDate;
  }

  if (filter.mode === 'custom') {
    if (filter.startDate && filter.endDate) {
      return dateStr >= filter.startDate && dateStr <= filter.endDate;
    }
    if (filter.startDate) {
      return dateStr >= filter.startDate;
    }
    if (filter.endDate) {
      return dateStr <= filter.endDate;
    }
    return true;
  }

  return true;
};

export const isTripInPeriod = (tripDate: string, filter: PeriodFilterState): boolean => {
  return isDateInPeriod(tripDate, filter);
};

export const getPeriodLabel = (filter: PeriodFilterState): string => {
  if (filter.mode === 'current_month') {
    const cur = getCurrentMonthInfo();
    return cur.fullLabel;
  }
  if (filter.mode === 'previous_month') {
    const prev = getPreviousMonthInfo();
    return prev.fullLabel;
  }
  if (filter.mode === 'custom') {
    if (filter.startDate && filter.endDate) {
      return `Período: ${formatDateBR(filter.startDate)} até ${formatDateBR(filter.endDate)}`;
    }
    if (filter.startDate) {
      return `A partir de ${formatDateBR(filter.startDate)}`;
    }
    if (filter.endDate) {
      return `Até ${formatDateBR(filter.endDate)}`;
    }
    return 'Período Personalizado (Datas não definidas)';
  }
  return 'Todo o Período (Geral)';
};
