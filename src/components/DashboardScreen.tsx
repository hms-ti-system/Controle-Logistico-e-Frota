import React, { useState, useMemo } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { formatDateBR, formatCurrencyBR, formatNumberBR, formatKM } from '../utils/formatters';
import { 
  BarChart3, 
  Truck, 
  Users, 
  Package, 
  Navigation, 
  ArrowRight, 
  RotateCcw,
  Plus,
  Calendar,
  Filter,
  Wrench,
  Fuel,
  AlertTriangle,
  CheckCircle2,
  Bell,
  ShieldAlert,
  Gauge,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { PeriodFilter } from './PeriodFilter';
import { 
  PeriodFilterState, 
  getInitialPeriodFilter, 
  isTripInPeriod, 
  getPeriodLabel 
} from '../utils/periodUtils';

interface DashboardScreenProps {
  onNavigate: (tab: 'dashboard' | 'trips' | 'maintenance' | 'fuel' | 'vehicles' | 'users' | 'routes') => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const { 
    trips, 
    users, 
    vehicles, 
    maintenancePlans = [], 
    fuelRecords = [], 
    resetToInitialData 
  } = useLogistics();

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Filter: Mês atual por padrão inicial, mês anterior e seleção de período por data
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterState>(getInitialPeriodFilter);

  // Trips filtered by selected period
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => isTripInPeriod(t.data, periodFilter));
  }, [trips, periodFilter]);

  const activePeriodLabel = useMemo(() => getPeriodLabel(periodFilter), [periodFilter]);

  // Metrics requested:
  // 1. Resumo de quantidade de viagens no período
  const totalViagensPeriodo = filteredTrips.length;
  const totalViagensGeral = trips.length;

  // 2. Resumo de quantidade de motoristas
  const motoristas = users.filter((u) => u.role === 'motorista');
  const motoristasAtivos = users.filter((u) => u.role === 'motorista' && u.ativo !== false);
  const totalMotoristas = motoristas.length;
  const totalMotoristasAtivos = motoristasAtivos.length;
  const motoristasComViagensNoPeriodo = new Set(filteredTrips.map((t) => t.motoristaId)).size;

  // 3. Total de container transportado no período (considera carregamentos de 1 ou 2 containers por carreta)
  const totalContainersTransportados = filteredTrips.reduce((acc, t) => acc + (t.container2 ? 2 : 1), 0);
  const containersSet = new Set<string>();
  filteredTrips.forEach((t) => {
    if (t.container) containersSet.add(t.container);
    if (t.container2) containersSet.add(t.container2);
  });
  const containersUnicos = containersSet.size;
  const viagensCarregamentoDuplo = filteredTrips.filter((t) => !!t.container2).length;

  // Vehicles summary (frota total)
  const cavalos = vehicles.filter((v) => v.tipo === 'Cavalo').length;
  const cavalosAtivos = vehicles.filter((v) => v.tipo === 'Cavalo' && v.ativo !== false).length;
  const carretas = vehicles.filter((v) => v.tipo === 'Carreta').length;
  const carretasAtivas = vehicles.filter((v) => v.tipo === 'Carreta' && v.ativo !== false).length;

  // Trips per driver in the filtered period
  const driverTripCounts = motoristas.map((driver) => {
    const driverTrips = filteredTrips.filter((t) => t.motoristaId === driver.id);
    const count = driverTrips.length;
    return {
      driver,
      count,
    };
  }).sort((a, b) => b.count - a.count);

  // Route breakdown in the filtered period (Origem -> Destino)
  const routeMap = new Map<string, number>();
  filteredTrips.forEach((t) => {
    const routeKey = `${t.origem} → ${t.destino}`;
    routeMap.set(routeKey, (routeMap.get(routeKey) || 0) + 1);
  });
  const topRoutes = Array.from(routeMap.entries())
    .map(([route, count]) => ({ route, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxDriverTrips = Math.max(1, ...driverTripCounts.map((d) => d.count));

  // Maintenance summary
  const vehicleKmMap = useMemo(() => new Map(vehicles.map((v) => [v.placa, v.kmAtual || 0])), [vehicles]);
  const maintenanceAlertsSummary = useMemo(() => {
    let vencidos = 0;
    let proximos = 0;
    let emDia = 0;
    const todayTime = new Date().toISOString().slice(0, 10);

    maintenancePlans.forEach((p) => {
      if (p.tipoVeiculo === 'Cavalo') {
        const kmAtual = vehicleKmMap.get(p.placa) || 0;
        const proxima = p.kmProximaManutencao || 0;
        const kmRestante = proxima - kmAtual;
        if (kmRestante <= 0) vencidos++;
        else if (kmRestante <= (p.toleranciaAlertaKm || 1000)) proximos++;
        else emDia++;
      } else {
        const proximaData = p.dataProximaManutencao || '';
        if (proximaData) {
          const diasRestantes = Math.round((new Date(proximaData).getTime() - new Date(todayTime).getTime()) / (1000 * 60 * 60 * 24));
          const toleranciaDias = p.toleranciaAlertaDias || 15;
          if (diasRestantes <= 0) vencidos++;
          else if (diasRestantes <= toleranciaDias) proximos++;
          else emDia++;
        } else {
          emDia++;
        }
      }
    });
    return { vencidos, proximos, emDia, total: maintenancePlans.length };
  }, [maintenancePlans, vehicleKmMap]);

  // Detailed visual alerts for vehicles close to or past their maintenance KM limit
  const vehicleKmAlerts = useMemo(() => {
    const list: Array<{
      id: string;
      placa: string;
      modelo: string;
      itemServico: string;
      kmAtual: number;
      kmProxima: number;
      kmRestante: number;
      toleranciaKm: number;
      percentualProgresso: number;
      tipoAlerta: 'vencido' | 'proximo';
      diferencaKm: number;
    }> = [];

    maintenancePlans.forEach((plan) => {
      if (plan.tipoVeiculo === 'Cavalo') {
        const veh = vehicles.find((v) => v.placa === plan.placa);
        const kmAtual = veh?.kmAtual || 0;
        const kmProxima = plan.kmProximaManutencao || 0;
        const kmRestante = kmProxima - kmAtual;
        const tolerancia = plan.toleranciaAlertaKm || 1000;

        const totalInterval = plan.intervaloKm || 20000;
        const kmDesdeUltima = kmAtual - (plan.kmUltimaManutencao || 0);
        const percentualProgresso = Math.min(100, Math.max(0, Math.round((kmDesdeUltima / totalInterval) * 100)));

        if (kmRestante <= 0) {
          list.push({
            id: plan.id,
            placa: plan.placa,
            modelo: veh?.modelo || 'Cavalo Mecânico',
            itemServico: plan.itemServico,
            kmAtual,
            kmProxima,
            kmRestante,
            toleranciaKm: tolerancia,
            percentualProgresso: 100,
            tipoAlerta: 'vencido',
            diferencaKm: Math.abs(kmRestante),
          });
        } else if (kmRestante <= tolerancia) {
          list.push({
            id: plan.id,
            placa: plan.placa,
            modelo: veh?.modelo || 'Cavalo Mecânico',
            itemServico: plan.itemServico,
            kmAtual,
            kmProxima,
            kmRestante,
            toleranciaKm: tolerancia,
            percentualProgresso,
            tipoAlerta: 'proximo',
            diferencaKm: kmRestante,
          });
        }
      }
    });

    return list.sort((a, b) => {
      if (a.tipoAlerta === 'vencido' && b.tipoAlerta !== 'vencido') return -1;
      if (a.tipoAlerta !== 'vencido' && b.tipoAlerta === 'vencido') return 1;
      return a.kmRestante - b.kmRestante;
    });
  }, [maintenancePlans, vehicles]);

  const [alertFilter, setAlertFilter] = useState<'all' | 'vencido' | 'proximo'>('all');
  const [isAlertPanelCollapsed, setIsAlertPanelCollapsed] = useState(false);

  const filteredKmAlerts = useMemo(() => {
    if (alertFilter === 'all') return vehicleKmAlerts;
    return vehicleKmAlerts.filter((a) => a.tipoAlerta === alertFilter);
  }, [vehicleKmAlerts, alertFilter]);

  const countVencidosKm = vehicleKmAlerts.filter((a) => a.tipoAlerta === 'vencido').length;
  const countProximosKm = vehicleKmAlerts.filter((a) => a.tipoAlerta === 'proximo').length;

  // Fuel in selected period
  const periodFuelRecords = useMemo(() => {
    return fuelRecords.filter((f) => isTripInPeriod(f.data, periodFilter));
  }, [fuelRecords, periodFilter]);

  const fuelSummary = useMemo(() => {
    const totalGasto = periodFuelRecords.reduce((acc, f) => acc + (f.totalAbastecido || 0), 0);
    const totalLitros = periodFuelRecords.reduce((acc, f) => acc + (f.quantidadeLitros || 0), 0);
    const totalKmRodados = periodFuelRecords.reduce((acc, f) => acc + (f.kmRodados || 0), 0);
    const mediaConsumo = totalLitros > 0 && totalKmRodados > 0 
      ? (totalKmRodados / totalLitros).toFixed(2) 
      : null;
    return { totalGasto, totalLitros, mediaConsumo, count: periodFuelRecords.length };
  }, [periodFuelRecords]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <span>Dashboard Operacional</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Resumo consolidado de viagens, motoristas e containers transportados
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onNavigate('trips')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Viagem</span>
          </button>
          <button
            onClick={() => setIsResetModalOpen(true)}
            title="Restaurar dados iniciais padrão"
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Period Filter: Mês Atual (Padrão Inicial), Mês Anterior, Seleção de Período por Data */}
      <PeriodFilter
        filter={periodFilter}
        onChange={setPeriodFilter}
        matchingCount={totalViagensPeriodo}
        title="Filtro do Período Operacional:"
      />

      {/* Sistema de Alertas Visuais no Dashboard: Notificação de Próxima Manutenção Preventiva por Quilometragem */}
      <div className={`rounded-xl border transition-all ${
        countVencidosKm > 0 
          ? 'bg-red-950/20 border-red-800/80 shadow-lg shadow-red-950/30' 
          : countProximosKm > 0 
            ? 'bg-amber-950/20 border-amber-800/80 shadow-lg shadow-amber-950/20'
            : 'bg-slate-900 border-slate-800'
      }`}>
        {/* Banner Header */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80">
          <div className="flex items-start sm:items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              countVencidosKm > 0
                ? 'bg-red-600/20 border-red-500/40 text-red-400 animate-pulse'
                : countProximosKm > 0
                  ? 'bg-amber-600/20 border-amber-500/40 text-amber-400'
                  : 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400'
            }`}>
              {countVencidosKm > 0 ? (
                <ShieldAlert className="w-5 h-5" />
              ) : countProximosKm > 0 ? (
                <Bell className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>Alertas de Manutenção Preventiva por Quilometragem</span>
                </h2>
                {countVencidosKm > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-600/30 text-red-300 border border-red-500/50 flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    <span>{countVencidosKm} Vencido{countVencidosKm > 1 ? 's' : ''}</span>
                  </span>
                )}
                {countProximosKm > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-600/30 text-amber-300 border border-amber-500/50 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{countProximosKm} Próximo{countProximosKm > 1 ? 's' : ''} do Limite</span>
                  </span>
                )}
                {vehicleKmAlerts.length === 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Nenhum alerta pendente
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitoramento contínuo dos odômetros dos cavalos mecânicos em relação aos limites de manutenção preventiva
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {vehicleKmAlerts.length > 0 && (
              <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setAlertFilter('all')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    alertFilter === 'all'
                      ? 'bg-slate-800 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todos ({vehicleKmAlerts.length})
                </button>
                {countVencidosKm > 0 && (
                  <button
                    type="button"
                    onClick={() => setAlertFilter('vencido')}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      alertFilter === 'vencido'
                        ? 'bg-red-600 text-white font-semibold shadow-sm'
                        : 'text-red-400 hover:text-red-300'
                    }`}
                  >
                    Vencidos ({countVencidosKm})
                  </button>
                )}
                {countProximosKm > 0 && (
                  <button
                    type="button"
                    onClick={() => setAlertFilter('proximo')}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      alertFilter === 'proximo'
                        ? 'bg-amber-600 text-white font-semibold shadow-sm'
                        : 'text-amber-400 hover:text-amber-300'
                    }`}
                  >
                    Próximos ({countProximosKm})
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => onNavigate('maintenance')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
            >
              <span>Ver Módulo Completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {vehicleKmAlerts.length > 0 && (
              <button
                type="button"
                onClick={() => setIsAlertPanelCollapsed(!isAlertPanelCollapsed)}
                title={isAlertPanelCollapsed ? 'Expandir alertas' : 'Minimizar alertas'}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isAlertPanelCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Banner Body */}
        {!isAlertPanelCollapsed && (
          <div className="p-4 sm:p-5">
            {vehicleKmAlerts.length === 0 ? (
              <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center gap-3 text-xs text-emerald-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold text-emerald-200">Quilometragens da frota em dia!</div>
                  <div className="text-[11px] text-emerald-400/90 mt-0.5">
                    Nenhum cavalo mecânico está próximo ou acima do limite estipulado para a próxima troca de óleo ou revisão preventiva.
                  </div>
                </div>
              </div>
            ) : filteredKmAlerts.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Nenhum alerta encontrado para o filtro selecionado.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredKmAlerts.map((alert) => {
                  const isVencido = alert.tipoAlerta === 'vencido';

                  return (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                        isVencido
                          ? 'bg-slate-950/90 border-red-800/70 hover:border-red-600'
                          : 'bg-slate-950/90 border-amber-800/70 hover:border-amber-600'
                      }`}
                    >
                      <div>
                        {/* Top card header */}
                        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-base font-bold text-white tracking-wide">
                                {alert.placa}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                isVencido
                                  ? 'bg-red-950 text-red-300 border border-red-700/80 animate-pulse'
                                  : 'bg-amber-950 text-amber-300 border border-amber-700/80'
                              }`}>
                                {isVencido ? 'KM Vencido' : 'Próximo do Limite'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {alert.modelo}
                            </div>
                          </div>

                          <div className={`p-1.5 rounded-lg border shrink-0 ${
                            isVencido
                              ? 'bg-red-950/80 border-red-800/80 text-red-400'
                              : 'bg-amber-950/80 border-amber-800/80 text-amber-400'
                          }`}>
                            <Gauge className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Service Item Name */}
                        <div className="mt-3">
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
                            Serviço Programado
                          </span>
                          <span className="text-xs font-semibold text-slate-200 line-clamp-2 mt-0.5">
                            {alert.itemServico}
                          </span>
                        </div>

                        {/* Kilometer Stats */}
                        <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Odômetro Atual</span>
                            <span className="text-xs font-mono font-bold text-slate-200">
                              {formatKM(alert.kmAtual)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Limite do Serviço</span>
                            <span className="text-xs font-mono font-bold text-slate-200">
                              {formatKM(alert.kmProxima)}
                            </span>
                          </div>
                        </div>

                        {/* Remaining / Overdue badge indicator */}
                        <div className="mt-3">
                          <div className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between ${
                            isVencido
                              ? 'bg-red-950/80 border border-red-800/60 text-red-300'
                              : 'bg-amber-950/80 border border-amber-800/60 text-amber-300'
                          }`}>
                            <span className="flex items-center gap-1.5">
                              {isVencido ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> : <Clock className="w-3.5 h-3.5 text-amber-400" />}
                              <span>{isVencido ? 'Ultrapassou o limite:' : 'Faltam para o limite:'}</span>
                            </span>
                            <span className="font-mono font-bold">
                              {alert.diferencaKm.toLocaleString('pt-BR')} km
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar of the maintenance cycle */}
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>Ciclo de manutenção</span>
                            <span className={`font-bold ${isVencido ? 'text-red-400' : 'text-amber-400'}`}>
                              {alert.percentualProgresso}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isVencido ? 'bg-red-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${alert.percentualProgresso}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card Action */}
                      <button
                        type="button"
                        onClick={() => onNavigate('maintenance')}
                        className={`w-full mt-4 pt-2.5 border-t border-slate-800/80 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                          isVencido
                            ? 'text-red-400 hover:text-red-300'
                            : 'text-amber-400 hover:text-amber-300'
                        }`}
                      >
                        <span>Registrar manutenção</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Quantidade de Viagens */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Quantidade de Viagens</span>
            <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-800/60 text-blue-400">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-bold text-white font-mono tabular-nums">{totalViagensPeriodo}</div>
            <div className="text-xs text-slate-400 mt-1">
              Viagens no período ({activePeriodLabel})
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {totalViagensGeral} viagens no histórico geral
            </div>
          </div>
          <button
            onClick={() => onNavigate('trips')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1 self-start pt-2 border-t border-slate-800/80 w-full"
          >
            <span>Ver controle de viagens</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* 2. Quantidade de Motoristas */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Motoristas em Operação</span>
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-bold text-emerald-400 font-mono tabular-nums">{motoristasComViagensNoPeriodo}</div>
            <div className="text-xs text-slate-400 mt-1">
              Motoristas com viagens no período
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {totalMotoristasAtivos} ativos na frota ({totalMotoristas} no histórico)
            </div>
          </div>
          <button
            onClick={() => onNavigate('users')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 self-start pt-2 border-t border-slate-800/80 w-full"
          >
            <span>Ver cadastro de usuários</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* 3. Total de Containers Transportados */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total de Containers Transportados</span>
            <div className="p-2 rounded-lg bg-sky-950/60 border border-sky-800/60 text-sky-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-bold text-sky-400 font-mono tabular-nums">{totalContainersTransportados}</div>
            <div className="text-xs text-slate-400 mt-1">
              {containersUnicos} identificações únicas no período
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {viagensCarregamentoDuplo > 0 
                ? `${viagensCarregamentoDuplo} viagem(ns) com 2 containers na mesma carreta` 
                : 'Reflete movimentações no filtro ativo'}
            </div>
          </div>
          <button
            onClick={() => onNavigate('trips')}
            className="text-xs text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1 self-start pt-2 border-t border-slate-800/80 w-full"
          >
            <span>Ver containers nas viagens</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Secondary Metrics / Frota */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400">Total de Veículos</div>
          <div className="text-xl font-bold text-white mt-1 font-mono tabular-nums">{vehicles.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            <span className="text-emerald-400 font-semibold">{cavalosAtivos + carretasAtivas} ativos</span> na frota
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400">Cavalos (Tratores)</div>
          <div className="text-xl font-bold text-amber-400 mt-1 font-mono tabular-nums">{cavalosAtivos}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{cavalosAtivos} ativos de {cavalos} cadastrados</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400">Carretas (Porta-Containers)</div>
          <div className="text-xl font-bold text-sky-400 mt-1 font-mono tabular-nums">{carretasAtivas}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{carretasAtivas} ativas de {carretas} cadastradas</div>
        </div>
      </div>

      {/* Módulos de Operação e Custos: Manutenção Preventiva & Controle de Abastecimento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card: Manutenção Preventiva */}
        <div className={`p-5 rounded-xl border transition-all ${
          maintenanceAlertsSummary.vencidos > 0 
            ? 'bg-red-950/20 border-red-800/60' 
            : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Manutenção Preventiva</h3>
                <p className="text-[11px] text-slate-400">Alertas de vencimento de KM da frota</p>
              </div>
            </div>

            {maintenanceAlertsSummary.vencidos > 0 ? (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-600/30 text-red-300 border border-red-500/50 flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span>{maintenanceAlertsSummary.vencidos} Vencida{maintenanceAlertsSummary.vencidos > 1 ? 's' : ''}</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Frota em Dia</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 my-3 text-center">
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Vencidas</span>
              <span className={`text-lg font-bold font-mono ${
                maintenanceAlertsSummary.vencidos > 0 ? 'text-red-400' : 'text-slate-300'
              }`}>
                {maintenanceAlertsSummary.vencidos}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Atenção</span>
              <span className="text-lg font-bold font-mono text-amber-400">
                {maintenanceAlertsSummary.proximos}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Em Dia</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {maintenanceAlertsSummary.emDia}
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('maintenance')}
            className="w-full mt-1 pt-2 border-t border-slate-800/80 text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center justify-between"
          >
            <span>Ver alertas e registrar serviços</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card: Controle de Abastecimento */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Fuel className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Controle de Abastecimento</h3>
                <p className="text-[11px] text-slate-400">Gastos e consumo por cavalo ({activePeriodLabel})</p>
              </div>
            </div>

            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-950 text-blue-300 border border-blue-800">
              {fuelSummary.count} abastecimento{fuelSummary.count === 1 ? '' : 's'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 my-3 text-center">
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Gasto Total</span>
              <span className="text-xs font-bold font-mono text-emerald-400 truncate block">
                {formatCurrencyBR(fuelSummary.totalGasto)}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Litros</span>
              <span className="text-xs font-bold font-mono text-blue-400 truncate block">
                {formatNumberBR(fuelSummary.totalLitros, 1)} L
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Consumo</span>
              <span className="text-xs font-bold font-mono text-purple-400 block">
                {fuelSummary.mediaConsumo ? `${fuelSummary.mediaConsumo} km/L` : '---'}
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('fuel')}
            className="w-full mt-1 pt-2 border-t border-slate-800/80 text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center justify-between"
          >
            <span>Ver lançamentos de abastecimento</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Two Column Layout: Driver Performance + Top Routes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Viagens por Motorista */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Viagens por Motorista</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Desempenho no período: <span className="text-slate-300 font-medium">{activePeriodLabel}</span>
              </p>
            </div>
            <button
              onClick={() => onNavigate('users')}
              className="text-xs text-slate-400 hover:text-white"
            >
              Ver motoristas
            </button>
          </div>

          <div className="space-y-4">
            {driverTripCounts.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Nenhum motorista cadastrado.</p>
            ) : (
              driverTripCounts.map(({ driver, count }) => {
                const percent = Math.round((count / maxDriverTrips) * 100);

                return (
                  <div key={driver.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-200 font-medium">{driver.nome}</span>
                        {driver.ativo === false && (
                          <span className="px-1.5 py-0.5 bg-slate-800 text-[10px] text-amber-400 border border-amber-800/40 rounded">
                            Inativo
                          </span>
                        )}
                      </div>
                      <span className="text-slate-300 font-mono tabular-nums font-semibold">
                        {count} {count === 1 ? 'viagem' : 'viagens'}
                      </span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>CPF: {driver.cpf}</span>
                      <span>{count} containers transportados</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Principais Rotas */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-400" />
                <span>Principais Rotas Operadas</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Rotas no período: <span className="text-slate-300 font-medium">{activePeriodLabel}</span>
              </p>
            </div>
            <button
              onClick={() => onNavigate('routes')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              Ver rotas
            </button>
          </div>

          <div className="space-y-3">
            {topRoutes.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Nenhuma rota operada no período selecionado.</p>
            ) : (
              topRoutes.map(({ route, count }, index) => {
                const parts = route.split(' → ');
                const origem = parts[0] || '';
                const destino = parts[1] || '';

                return (
                  <div
                    key={index}
                    className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-slate-200 font-medium truncate">
                        <span className="truncate">{origem}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate text-blue-300">{destino}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Linha de transporte de containers
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono tabular-nums font-bold text-white">
                        {count} {count === 1 ? 'viagem' : 'viagens'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {count} {count === 1 ? 'container' : 'containers'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Trips Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Viagens no Período Selecionado</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {activePeriodLabel} • Mostrando até 10 registros
            </p>
          </div>
          <button
            onClick={() => onNavigate('trips')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
          >
            <span>Ver controle completo</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Data</th>
                <th className="py-2.5 px-3 font-semibold">Container</th>
                <th className="py-2.5 px-3 font-semibold">Motorista</th>
                <th className="py-2.5 px-3 font-semibold">Placa Cavalo</th>
                <th className="py-2.5 px-3 font-semibold">Placa Carreta</th>
                <th className="py-2.5 px-3 font-semibold">Origem → Destino</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Nenhuma viagem registrada no período selecionado ({activePeriodLabel}).
                  </td>
                </tr>
              ) : (
                filteredTrips.slice(0, 10).map((trip) => (
                  <tr key={trip.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono tabular-nums text-slate-300 whitespace-nowrap">
                      {formatDateBR(trip.data)}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-sky-400 whitespace-nowrap">
                      {trip.container}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200 font-medium">
                      {trip.motoristaNome}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-amber-400 font-semibold whitespace-nowrap">
                      {trip.placaCavalo}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-sky-400 font-semibold whitespace-nowrap">
                      {trip.placaCarreta}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">
                      {trip.origem} → {trip.destino}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Reset Modal */}
      <ConfirmDeleteModal
        isOpen={isResetModalOpen}
        title="Restaurar Dados Iniciais"
        message="Deseja restaurar todos os dados iniciais de demonstração? Isso substituirá quaisquer alterações recentes."
        confirmLabel="Sim, Restaurar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          resetToInitialData();
          setIsResetModalOpen(false);
        }}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  );
};
