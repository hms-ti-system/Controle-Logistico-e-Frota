import React from 'react';
import { Calendar, Clock, ChevronRight, X, Filter } from 'lucide-react';
import {
  PeriodFilterState,
  PeriodMode,
  getCurrentMonthInfo,
  getPreviousMonthInfo,
  getPeriodLabel,
} from '../utils/periodUtils';

interface PeriodFilterProps {
  filter: PeriodFilterState;
  onChange: (newFilter: PeriodFilterState) => void;
  matchingCount?: number;
  className?: string;
  title?: string;
}

export const PeriodFilter: React.FC<PeriodFilterProps> = ({
  filter,
  onChange,
  matchingCount,
  className = '',
  title = 'Filtrar por Período:',
}) => {
  const currentMonthInfo = getCurrentMonthInfo();
  const prevMonthInfo = getPreviousMonthInfo();

  const handleSelectMode = (mode: PeriodMode) => {
    if (mode === 'current_month') {
      onChange({
        mode: 'current_month',
        startDate: currentMonthInfo.startDate,
        endDate: currentMonthInfo.endDate,
      });
    } else if (mode === 'previous_month') {
      onChange({
        mode: 'previous_month',
        startDate: prevMonthInfo.startDate,
        endDate: prevMonthInfo.endDate,
      });
    } else if (mode === 'custom') {
      // Keep existing custom dates if any, or default to current month as starting basis
      onChange({
        mode: 'custom',
        startDate: filter.startDate || currentMonthInfo.startDate,
        endDate: filter.endDate || currentMonthInfo.endDate,
      });
    } else if (mode === 'all') {
      onChange({
        mode: 'all',
        startDate: '',
        endDate: '',
      });
    }
  };

  const handleStartDateChange = (val: string) => {
    onChange({
      ...filter,
      mode: 'custom',
      startDate: val,
    });
  };

  const handleEndDateChange = (val: string) => {
    onChange({
      ...filter,
      mode: 'custom',
      endDate: val,
    });
  };

  const handleClearCustomDates = () => {
    onChange({
      ...filter,
      mode: 'custom',
      startDate: '',
      endDate: '',
    });
  };

  const periodLabel = getPeriodLabel(filter);

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 space-y-3 ${className}`}>
      {/* Top Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-950/70 border border-blue-800/60 text-blue-400">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200">{title}</div>
            <div className="text-[11px] text-slate-400">
              {periodLabel}
              {typeof matchingCount === 'number' && (
                <span className="text-blue-400 font-medium ml-1.5">
                  ({matchingCount} {matchingCount === 1 ? 'viagem' : 'viagens'})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Buttons: Mês Atual | Mês Anterior | Seleção por Data | Todos */}
        <div className="inline-flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1 border border-slate-800 rounded-lg">
          {/* 1. Mês Atual (Padrão Inicial) */}
          <button
            type="button"
            onClick={() => handleSelectMode('current_month')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              filter.mode === 'current_month'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Mês Atual</span>
            <span
              className={`text-[10px] hidden sm:inline px-1.5 py-0.2 rounded ${
                filter.mode === 'current_month' ? 'bg-blue-700/80 text-blue-100' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {currentMonthInfo.label}
            </span>
          </button>

          {/* 2. Mês Anterior */}
          <button
            type="button"
            onClick={() => handleSelectMode('previous_month')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              filter.mode === 'previous_month'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Mês Anterior</span>
            <span
              className={`text-[10px] hidden sm:inline px-1.5 py-0.2 rounded ${
                filter.mode === 'previous_month' ? 'bg-blue-700/80 text-blue-100' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {prevMonthInfo.label}
            </span>
          </button>

          {/* 3. Seleção de Período por Data */}
          <button
            type="button"
            onClick={() => handleSelectMode('custom')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              filter.mode === 'custom'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Período por Data</span>
          </button>

          {/* 4. Todas as Viagens (Histórico Completo) */}
          <button
            type="button"
            onClick={() => handleSelectMode('all')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              filter.mode === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Exibir todas as viagens sem restrição de data"
          >
            <span>Todos</span>
          </button>
        </div>
      </div>

      {/* Expanded Custom Date Picker Bar (Only shown when 'custom' is active) */}
      {filter.mode === 'custom' && (
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 text-xs font-medium">De:</span>
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
            />

            <span className="text-slate-400 text-xs font-medium">Até:</span>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
            />

            {(filter.startDate || filter.endDate) && (
              <button
                type="button"
                onClick={handleClearCustomDates}
                className="inline-flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors text-[11px]"
                title="Limpar campos de data"
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpar datas</span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-400 italic">
            {filter.startDate && filter.endDate ? (
              <span>Exibindo viagens entre {filter.startDate} e {filter.endDate}</span>
            ) : filter.startDate ? (
              <span>Exibindo viagens a partir de {filter.startDate}</span>
            ) : filter.endDate ? (
              <span>Exibindo viagens até {filter.endDate}</span>
            ) : (
              <span>Selecione a data inicial e/ou final para filtrar</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
