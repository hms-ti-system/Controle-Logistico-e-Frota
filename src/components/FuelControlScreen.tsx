import React, { useState, useMemo } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { FuelRecord } from '../types/logistics';
import { 
  formatDateBR, 
  formatKM, 
  formatCurrencyBR, 
  formatNumberBR, 
  formatPlate 
} from '../utils/formatters';
import { PeriodFilter } from './PeriodFilter';
import { 
  getInitialPeriodFilter, 
  PeriodFilterState, 
  isDateInPeriod, 
  getPeriodLabel 
} from '../utils/periodUtils';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { 
  Fuel, 
  Plus, 
  Search, 
  Download, 
  Edit2, 
  Trash2, 
  Filter, 
  X, 
  Truck, 
  Gauge, 
  DollarSign, 
  MapPin, 
  User as UserIcon, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Receipt,
  Droplet
} from 'lucide-react';

const COMMON_FUEL_LOCATIONS = [
  'Posto Graal Rodoanel KM 29 - SP',
  'Posto Shell Paranaguá Terminal - PR',
  'Posto Ipiranga Dutra Taubaté - SP',
  'Posto BR Petrobras Suape Cabo - PE',
  'Posto Ipiranga Cubatão Cônego - SP',
  'Posto Ipiranga BR-392 Rio Grande - RS',
  'Garagem Central Santos Translog',
  'Posto Shell Imigrantes KM 38 - SP',
  'Posto Graal Betim Fernão Dias - MG',
  'Posto Décio Itumbiara - GO'
];

export const FuelControlScreen: React.FC = () => {
  const { 
    currentUser, 
    vehicles, 
    users, 
    fuelRecords, 
    addFuelRecord, 
    updateFuelRecord, 
    deleteFuelRecord,
    updateVehicleKm
  } = useLogistics();

  const isMotorista = currentUser?.role === 'motorista';

  // Period Filter: default 'current_month'
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterState>(getInitialPeriodFilter());

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [selectedDriver, setSelectedDriver] = useState<string>(isMotorista ? currentUser.id : 'all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFuelId, setEditingFuelId] = useState<string | null>(null);

  // Form Fields (Required by User: Motorista, Data, placa, KM, local de abastecimento, Quantidade de litros, valor por litro, total em R$ abastecido)
  const [motoristaId, setMotoristaId] = useState('');
  const [motoristaNome, setMotoristaNome] = useState('');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [placa, setPlaca] = useState('');
  const [km, setKm] = useState<number | ''>('');
  const [localAbastecimento, setLocalAbastecimento] = useState('');
  const [quantidadeLitros, setQuantidadeLitros] = useState<number | ''>('');
  const [valorPorLitro, setValorPorLitro] = useState<number | ''>(5.89);
  const [totalAbastecido, setTotalAbastecido] = useState<number | ''>('');
  const [tipoCombustivel, setTipoCombustivel] = useState('Diesel S10');
  const [numeroNotaFiscal, setNumeroNotaFiscal] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    fuelId: string;
    title: string;
    message: string;
  }>({
    isOpen: false,
    fuelId: '',
    title: '',
    message: '',
  });

  // Notification feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Only Cavalos are used for fuel control
  const horseVehicles = useMemo(() => {
    return vehicles.filter(v => v.tipo === 'Cavalo');
  }, [vehicles]);

  // Active drivers list
  const activeDrivers = useMemo(() => {
    return users.filter(u => u.role === 'motorista' && u.ativo !== false);
  }, [users]);

  // Filter fuel records for current user if driver
  const userVisibleRecords = useMemo(() => {
    if (isMotorista) {
      return fuelRecords.filter(f => f.motoristaId === currentUser.id);
    }
    return fuelRecords;
  }, [fuelRecords, isMotorista, currentUser]);

  // Apply Period, Search, Vehicle, and Driver filters
  const filteredRecords = useMemo(() => {
    return userVisibleRecords.filter(rec => {
      // 1. Period filter
      if (!isDateInPeriod(rec.data, periodFilter)) return false;

      // 2. Vehicle filter
      if (selectedVehicle !== 'all' && rec.placa !== selectedVehicle) return false;

      // 3. Driver filter (for gestor)
      if (!isMotorista && selectedDriver !== 'all' && rec.motoristaId !== selectedDriver) return false;

      // 4. Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesPlaca = rec.placa.toLowerCase().includes(query);
        const matchesMotorista = rec.motoristaNome.toLowerCase().includes(query);
        const matchesLocal = rec.localAbastecimento.toLowerCase().includes(query);
        const matchesNF = (rec.numeroNotaFiscal || '').toLowerCase().includes(query);
        const matchesObs = (rec.observacoes || '').toLowerCase().includes(query);
        if (!matchesPlaca && !matchesMotorista && !matchesLocal && !matchesNF && !matchesObs) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => b.data.localeCompare(a.data) || b.km - a.km);
  }, [userVisibleRecords, periodFilter, selectedVehicle, selectedDriver, searchTerm, isMotorista]);

  // Aggregate KPI metrics for the period
  const kpiData = useMemo(() => {
    const totalGasto = filteredRecords.reduce((acc, r) => acc + (r.totalAbastecido || 0), 0);
    const totalLitros = filteredRecords.reduce((acc, r) => acc + (r.quantidadeLitros || 0), 0);
    const precoMedioLitro = totalLitros > 0 ? totalGasto / totalLitros : 0;

    // Calculate fleet average consumption for records that have consumoMedio
    const recordsWithConsumption = filteredRecords.filter(r => r.consumoMedio && r.consumoMedio > 0);
    const totalKmRodados = filteredRecords.reduce((acc, r) => acc + (r.kmRodados || 0), 0);
    const mediaConsumoFrota = totalLitros > 0 && totalKmRodados > 0 
      ? totalKmRodados / totalLitros 
      : (recordsWithConsumption.length > 0 
          ? recordsWithConsumption.reduce((acc, r) => acc + r.consumoMedio!, 0) / recordsWithConsumption.length 
          : 0);

    const cavalosAtendidos = new Set(filteredRecords.map(r => r.placa)).size;
    const motoristasEnvolvidos = new Set(filteredRecords.map(r => r.motoristaId)).size;

    return {
      totalGasto,
      totalLitros,
      precoMedioLitro,
      mediaConsumoFrota,
      totalKmRodados,
      cavalosAtendidos,
      motoristasEnvolvidos,
      totalAbastecimentos: filteredRecords.length,
    };
  }, [filteredRecords]);

  // Automatically recalculate Total in R$ when Liters or Price/L changes
  const handleLitrosChange = (val: string) => {
    const numLitros = val === '' ? '' : parseFloat(val);
    setQuantidadeLitros(numLitros);

    if (numLitros !== '' && valorPorLitro !== '') {
      const calcTotal = Number((numLitros * Number(valorPorLitro)).toFixed(2));
      setTotalAbastecido(calcTotal);
    }
  };

  const handleValorPorLitroChange = (val: string) => {
    const numValor = val === '' ? '' : parseFloat(val);
    setValorPorLitro(numValor);

    if (numValor !== '' && quantidadeLitros !== '') {
      const calcTotal = Number((Number(quantidadeLitros) * numValor).toFixed(2));
      setTotalAbastecido(calcTotal);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingFuelId(null);
    setData(new Date().toISOString().slice(0, 10));

    // Default Driver
    if (isMotorista) {
      setMotoristaId(currentUser.id);
      setMotoristaNome(currentUser.nome);
    } else {
      const defaultDriver = activeDrivers[0];
      setMotoristaId(defaultDriver?.id || '');
      setMotoristaNome(defaultDriver?.nome || '');
    }

    // Default Horse
    const defaultHorse = horseVehicles[0];
    const initialPlaca = defaultHorse?.placa || '';
    setPlaca(initialPlaca);

    // Initial KM suggested from vehicle
    const currentKm = defaultHorse?.kmAtual || 0;
    setKm(currentKm > 0 ? currentKm + 500 : 1000);

    setLocalAbastecimento('');
    setQuantidadeLitros('');
    setValorPorLitro(5.89);
    setTotalAbastecido('');
    setTipoCombustivel('Diesel S10');
    setNumeroNotaFiscal('');
    setObservacoes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rec: FuelRecord) => {
    setEditingFuelId(rec.id);
    setMotoristaId(rec.motoristaId);
    setMotoristaNome(rec.motoristaNome);
    setData(rec.data);
    setPlaca(rec.placa);
    setKm(rec.km);
    setLocalAbastecimento(rec.localAbastecimento);
    setQuantidadeLitros(rec.quantidadeLitros);
    setValorPorLitro(rec.valorPorLitro);
    setTotalAbastecido(rec.totalAbastecido);
    setTipoCombustivel(rec.tipoCombustivel || 'Diesel S10');
    setNumeroNotaFiscal(rec.numeroNotaFiscal || '');
    setObservacoes(rec.observacoes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle Save (Create / Update)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanPlate = formatPlate(placa);
    if (!cleanPlate || cleanPlate.length < 7) {
      setFormError('Informe uma placa de Cavalo válida com 7 caracteres.');
      return;
    }

    if (!data) {
      setFormError('Informe a data do abastecimento.');
      return;
    }

    if (!motoristaNome.trim()) {
      setFormError('Selecione ou informe o motorista.');
      return;
    }

    if (km === '' || km < 0) {
      setFormError('Informe o odômetro (KM) no momento do abastecimento.');
      return;
    }

    if (!localAbastecimento.trim()) {
      setFormError('Informe o local de abastecimento (posto ou garagem).');
      return;
    }

    if (quantidadeLitros === '' || Number(quantidadeLitros) <= 0) {
      setFormError('Informe uma quantidade de litros válida maior que zero.');
      return;
    }

    if (valorPorLitro === '' || Number(valorPorLitro) <= 0) {
      setFormError('Informe um valor por litro válido.');
      return;
    }

    const calculatedTotal = totalAbastecido !== '' && Number(totalAbastecido) > 0
      ? Number(totalAbastecido)
      : Number((Number(quantidadeLitros) * Number(valorPorLitro)).toFixed(2));

    if (editingFuelId) {
      updateFuelRecord(editingFuelId, {
        motoristaId,
        motoristaNome,
        data,
        placa: cleanPlate,
        km: Number(km),
        localAbastecimento: localAbastecimento.trim(),
        quantidadeLitros: Number(quantidadeLitros),
        valorPorLitro: Number(valorPorLitro),
        totalAbastecido: calculatedTotal,
        tipoCombustivel,
        numeroNotaFiscal: numeroNotaFiscal.trim(),
        observacoes: observacoes.trim(),
      });
      showFeedback('Abastecimento atualizado com sucesso!');
    } else {
      addFuelRecord({
        motoristaId,
        motoristaNome,
        data,
        placa: cleanPlate,
        km: Number(km),
        localAbastecimento: localAbastecimento.trim(),
        quantidadeLitros: Number(quantidadeLitros),
        valorPorLitro: Number(valorPorLitro),
        totalAbastecido: calculatedTotal,
        tipoCombustivel,
        numeroNotaFiscal: numeroNotaFiscal.trim(),
        observacoes: observacoes.trim(),
      });
      showFeedback(`Abastecimento do cavalo ${cleanPlate} registrado com sucesso! Total: ${formatCurrencyBR(calculatedTotal)}`);
    }

    setIsModalOpen(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Data',
      'Placa Cavalo',
      'Motorista',
      'Odômetro (KM)',
      'KM Percorrido',
      'Local de Abastecimento',
      'Litros',
      'Valor por Litro (R$)',
      'Total Abastecido (R$)',
      'Consumo Médio (KM/L)',
      'Tipo Combustível',
      'Cupom / NF',
      'Observações'
    ];

    const rows = filteredRecords.map(r => [
      `"${formatDateBR(r.data)}"`,
      `"${r.placa}"`,
      `"${r.motoristaNome}"`,
      r.km,
      r.kmRodados || '',
      `"${r.localAbastecimento.replace(/"/g, '""')}"`,
      r.quantidadeLitros.toFixed(2),
      r.valorPorLitro.toFixed(2),
      r.totalAbastecido.toFixed(2),
      r.consumoMedio ? r.consumoMedio.toFixed(2) : '',
      `"${r.tipoCombustivel || 'Diesel S10'}"`,
      `"${(r.numeroNotaFiscal || '').replace(/"/g, '""')}"`,
      `"${(r.observacoes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `abastecimentos_frota_${periodFilter.mode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
      {feedback && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-sm transition-all border ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200' 
            : 'bg-red-950/80 border-red-800 text-red-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Screen Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <Fuel className="w-4 h-4" />
            <span>Gestão da Frota · Controle de Combustível</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Controle de Abastecimento por Cavalo
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro de abastecimentos, consumo médio por litro (KM/L), custos em R$ e histórico de notas fiscais.
          </p>
        </div>

        {/* New Refueling Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Abastecimento</span>
          </button>
        </div>
      </div>

      {/* Period Filter (Mês Atual default, Mês Anterior, Período por Data, Todos) */}
      <PeriodFilter
        filter={periodFilter}
        onChange={setPeriodFilter}
        matchingCount={filteredRecords.length}
        title="Filtro de Período para Abastecimento"
      />

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Gasto Total R$ */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Abastecido
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {formatCurrencyBR(kpiData.totalGasto)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {kpiData.totalAbastecimentos} abastecimento{kpiData.totalAbastecimentos === 1 ? '' : 's'} no período
          </p>
        </div>

        {/* 2. Litros Abastecidos */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Volume em Litros
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Droplet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-blue-400">
              {formatNumberBR(kpiData.totalLitros, 2)} L
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Média de {kpiData.totalAbastecimentos > 0 ? (kpiData.totalLitros / kpiData.totalAbastecimentos).toFixed(1) : 0} L por abastecimento
          </p>
        </div>

        {/* 3. Preço Médio / Litro */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Preço Médio por Litro
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-400">
              {formatCurrencyBR(kpiData.precoMedioLitro)}
            </span>
            <span className="text-xs text-slate-400">/ litro</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Diesel S10 praticado nos postos credenciados
          </p>
        </div>

        {/* 4. Média de Consumo da Frota */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Média de Consumo Frota
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-purple-400">
              {kpiData.mediaConsumoFrota > 0 ? `${kpiData.mediaConsumoFrota.toFixed(2)} km/L` : '---'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {formatKM(kpiData.totalKmRodados)} percorridos no período analisado
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por posto, placa, motorista, NF..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Horse Plate Filter */}
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Cavalo: Todos os Cavalos</option>
            {horseVehicles.map(v => (
              <option key={v.id} value={v.placa}>
                {v.placa} ({v.modelo || 'Cavalo'})
              </option>
            ))}
          </select>

          {/* Driver Filter (if Gestor) */}
          {!isMotorista && (
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">Motorista: Todos</option>
              {activeDrivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* CSV Export Button */}
        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar Abastecimentos (CSV)</span>
        </button>
      </div>

      {/* Fuel Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Fuel className="w-4 h-4 text-blue-400" />
              <span>Lançamentos de Abastecimento</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {getPeriodLabel(periodFilter)} · {filteredRecords.length} registros encontrados
            </p>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Fuel className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-400">Nenhum abastecimento encontrado para os filtros selecionados</p>
            <p className="text-xs text-slate-500 mt-1">Alterne o período ou clique em "Novo Abastecimento" para lançar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Placa (Cavalo)</th>
                  <th className="py-3 px-4">Motorista</th>
                  <th className="py-3 px-4">KM Odômetro</th>
                  <th className="py-3 px-4">Local de Abastecimento</th>
                  <th className="py-3 px-4 text-right">Litros</th>
                  <th className="py-3 px-4 text-right">Valor / Litro</th>
                  <th className="py-3 px-4 text-right">Total em R$</th>
                  <th className="py-3 px-4 text-center">Consumo (KM/L)</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredRecords.map(rec => {
                  const horse = horseVehicles.find(h => h.placa === rec.placa);

                  return (
                    <tr key={rec.id} className="hover:bg-slate-800/50 transition-colors">
                      {/* Data */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-300">
                        {formatDateBR(rec.data)}
                      </td>

                      {/* Placa (Cavalo) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
                            {rec.placa}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            {horse?.modelo || 'Cavalo'}
                          </span>
                        </div>
                      </td>

                      {/* Motorista */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                          <span className="truncate max-w-[150px]">{rec.motoristaNome}</span>
                        </div>
                      </td>

                      {/* KM Odômetro & Delta */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                        <div className="font-semibold text-slate-200">
                          {formatKM(rec.km)}
                        </div>
                        {rec.kmRodados ? (
                          <div className="text-[10px] text-slate-500">
                            +{formatKM(rec.kmRodados)} rodados
                          </div>
                        ) : null}
                      </td>

                      {/* Local de Abastecimento */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-200 font-medium truncate max-w-[200px]">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{rec.localAbastecimento}</span>
                        </div>
                        {rec.numeroNotaFiscal && (
                          <div className="text-[10px] text-slate-500 ml-4">
                            NF/Cupom: {rec.numeroNotaFiscal}
                          </div>
                        )}
                      </td>

                      {/* Quantidade Litros */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right font-mono font-semibold text-blue-400">
                        {formatNumberBR(rec.quantidadeLitros, 2)} L
                      </td>

                      {/* Valor por Litro */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right font-mono text-slate-300">
                        {formatCurrencyBR(rec.valorPorLitro)}
                      </td>

                      {/* Total em R$ Abastecido */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right font-mono font-bold text-emerald-400">
                        {formatCurrencyBR(rec.totalAbastecido)}
                      </td>

                      {/* Consumo Médio (KM/L) */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        {rec.consumoMedio ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${
                            rec.consumoMedio >= 2.5
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : rec.consumoMedio >= 2.2
                              ? 'bg-blue-950 text-blue-300 border-blue-800'
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}>
                            {rec.consumoMedio.toFixed(2)} km/L
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">1º abastecimento</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(rec)}
                            title="Editar Abastecimento"
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({
                              isOpen: true,
                              fuelId: rec.id,
                              title: 'Excluir Lançamento de Abastecimento',
                              message: `Deseja realmente remover o abastecimento de ${formatNumberBR(rec.quantidadeLitros, 2)}L (${rec.placa}) em ${formatDateBR(rec.data)}?`,
                            })}
                            title="Excluir Abastecimento"
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: NOVO / EDITAR ABASTECIMENTO */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Fuel className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingFuelId ? 'Editar Lançamento de Abastecimento' : 'Novo Abastecimento por Cavalo'}
                </h3>
                <p className="text-xs text-slate-400">
                  Preencha os dados do abastecimento para controle de custos e consumo da frota
                </p>
              </div>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded-lg bg-red-950/80 border border-red-800 text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* 1. Motorista & Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Motorista */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Motorista *
                  </label>
                  {isMotorista ? (
                    <div className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 flex items-center gap-2">
                      <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{currentUser.nome} (Você)</span>
                    </div>
                  ) : (
                    <select
                      value={motoristaId}
                      onChange={(e) => {
                        const mId = e.target.value;
                        setMotoristaId(mId);
                        const found = users.find(u => u.id === mId);
                        if (found) setMotoristaNome(found.nome);
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      required
                    >
                      <option value="">Selecione o motorista...</option>
                      {activeDrivers.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.nome} ({d.cpf})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Data */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Data do Abastecimento *
                  </label>
                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* 2. Placa do Cavalo & KM do Odômetro */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Placa do Cavalo */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Placa do Cavalo *
                  </label>
                  <select
                    value={placa}
                    onChange={(e) => {
                      const selPlate = e.target.value;
                      setPlaca(selPlate);
                      const veh = horseVehicles.find(h => h.placa === selPlate);
                      if (veh && !editingFuelId && veh.kmAtual) {
                        setKm(veh.kmAtual + 600);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">Selecione o cavalo...</option>
                    {horseVehicles.map(h => (
                      <option key={h.id} value={h.placa}>
                        {h.placa} - {h.modelo || 'Cavalo'} (KM Atual: {formatKM(h.kmAtual)})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Apenas cavalos mecânicos da frota
                  </span>
                </div>

                {/* KM Odômetro */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Odômetro (KM) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={km}
                    onChange={(e) => setKm(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ex: 184250"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Atualiza o KM atual do cavalo caso seja superior
                  </span>
                </div>
              </div>

              {/* 3. Local de Abastecimento */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Local de Abastecimento (Posto / Garagem) *
                </label>
                <input
                  type="text"
                  list="fuel-locations-list"
                  value={localAbastecimento}
                  onChange={(e) => setLocalAbastecimento(e.target.value)}
                  placeholder="Ex: Posto Graal Rodoanel KM 29 - SP"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                />
                <datalist id="fuel-locations-list">
                  {COMMON_FUEL_LOCATIONS.map((loc, idx) => (
                    <option key={idx} value={loc} />
                  ))}
                </datalist>
              </div>

              {/* 4. Quantidade de Litros & Valor por Litro & Total em R$ */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                {/* Litros */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Quantidade de Litros *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      value={quantidadeLitros}
                      onChange={(e) => handleLitrosChange(e.target.value)}
                      placeholder="Ex: 380.00"
                      className="w-full pr-8 pl-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-[11px]">
                      L
                    </span>
                  </div>
                </div>

                {/* Valor por Litro */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Valor por Litro (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.001"
                      min="0.01"
                      value={valorPorLitro}
                      onChange={(e) => handleValorPorLitroChange(e.target.value)}
                      placeholder="Ex: 5.89"
                      className="w-full pl-8 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Total em R$ */}
                <div>
                  <label className="block text-xs font-medium text-emerald-400 mb-1">
                    Total Abastecido (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-500 text-xs font-mono">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      value={totalAbastecido}
                      onChange={(e) => setTotalAbastecido(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 text-xs bg-slate-900 border border-emerald-600/50 rounded-lg text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-400"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Calculado automaticamente
                  </span>
                </div>
              </div>

              {/* 5. Campos Adicionais: Combustível, NF e Observações */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tipo de Combustível
                  </label>
                  <select
                    value={tipoCombustivel}
                    onChange={(e) => setTipoCombustivel(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Diesel S10">Diesel S10 (Padrão)</option>
                    <option value="Diesel S500">Diesel S500</option>
                    <option value="Arla 32">Arla 32 (Reagente)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Número do Cupom / Nota Fiscal
                  </label>
                  <input
                    type="text"
                    value={numeroNotaFiscal}
                    onChange={(e) => setNumeroNotaFiscal(e.target.value)}
                    placeholder="Ex: NF-782194 ou Cupom 0129"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Observações (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Tanque cheio antes da viagem para o Porto de Santos..."
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-sm"
                >
                  {editingFuelId ? 'Salvar Alterações' : 'Salvar Abastecimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.title}
        message={deleteModal.message}
        onConfirm={() => {
          deleteFuelRecord(deleteModal.fuelId);
          showFeedback('Lançamento de abastecimento excluído.');
          setDeleteModal(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
