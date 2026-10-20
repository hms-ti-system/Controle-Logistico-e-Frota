import React, { useState, useMemo } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { Trip, Route, ContainerLoadType } from '../types/logistics';
import { formatContainer, formatDateBR } from '../utils/formatters';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { PeriodFilter } from './PeriodFilter';
import { 
  PeriodFilterState, 
  getInitialPeriodFilter, 
  isTripInPeriod, 
  getPeriodLabel 
} from '../utils/periodUtils';
import { 
  Navigation, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Package, 
  Download, 
  Calendar,
  Filter,
  User as UserIcon,
  Route as RouteIcon,
  Layers
} from 'lucide-react';

const COMMON_ORIGINS = [
  'Porto de Santos - SP',
  'Porto de Paranaguá - PR',
  'Porto de Itajaí - SC',
  'Terminal de Suape - PE',
  'Porto de Rio Grande - RS',
  'Pátio Regulador Cubatão - SP',
  'Porto Seco Taubaté - SP',
];

const COMMON_DESTINATIONS = [
  'Terminal Intermodal Campinas - SP',
  'Polo Industrial Betim - MG',
  'Porto de Santos (BTP) - SP',
  'Distrito Industrial Goiana - PE',
  'Polo Petroquímico Triunfo - RS',
  'Centro Logístico Curitiba - PR',
  'Polo Industrial Manaus - AM',
];

export const TripControlScreen: React.FC = () => {
  const { trips, users, vehicles, routes, addTrip, updateTrip, deleteTrip, currentUser } = useLogistics();

  const isMotorista = currentUser?.role === 'motorista';

  // Base trips: if Motorista, ONLY trips where this driver participated
  const userVisibleTrips = useMemo(() => {
    if (isMotorista && currentUser) {
      return trips.filter((t) => t.motoristaId === currentUser.id);
    }
    return trips;
  }, [trips, isMotorista, currentUser]);

  // Period Filter: Mês Atual (Padrão Inicial), Mês Anterior, Seleção de Período por Data, Todos
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterState>(getInitialPeriodFilter);
  const activePeriodLabel = useMemo(() => getPeriodLabel(periodFilter), [periodFilter]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [motoristaFilter, setMotoristaFilter] = useState<string>('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);

  // Form fields strictly matching the requested data:
  // Data, Motorista, Placa do Cavalo, Placa da Carreta, Origem, Destino, Container
  const [data, setData] = useState(() => new Date().toISOString().split('T')[0]);
  const [motoristaId, setMotoristaId] = useState(() => (isMotorista && currentUser ? currentUser.id : ''));
  const [placaCavalo, setPlacaCavalo] = useState('');
  const [placaCarreta, setPlacaCarreta] = useState('');
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [tipoCarregamento, setTipoCarregamento] = useState<ContainerLoadType>('1_container');
  const [container, setContainer] = useState('');
  const [container2, setContainer2] = useState('');

  // Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const allMotoristas = users.filter((u) => u.role === 'motorista');
  const activeMotoristas = users.filter((u) => u.role === 'motorista' && u.ativo !== false);

  const allCavalos = vehicles.filter((v) => v.tipo === 'Cavalo');
  const activeCavalos = vehicles.filter((v) => v.tipo === 'Cavalo' && v.ativo !== false);

  const allCarretas = vehicles.filter((v) => v.tipo === 'Carreta');
  const activeCarretas = vehicles.filter((v) => v.tipo === 'Carreta' && v.ativo !== false);

  // When editing an older trip, ensure its assigned driver and vehicles are available in the dropdown
  const selectableMotoristas = useMemo(() => {
    if (!editingTripId) return activeMotoristas;
    const assigned = allMotoristas.find((m) => m.id === motoristaId);
    if (assigned && assigned.ativo === false) {
      return [...activeMotoristas, assigned];
    }
    return activeMotoristas;
  }, [activeMotoristas, allMotoristas, editingTripId, motoristaId]);

  const selectableCavalos = useMemo(() => {
    if (!editingTripId) return activeCavalos;
    const assigned = allCavalos.find((c) => c.placa === placaCavalo);
    if (assigned && assigned.ativo === false) {
      return [...activeCavalos, assigned];
    }
    return activeCavalos;
  }, [activeCavalos, allCavalos, editingTripId, placaCavalo]);

  const selectableCarretas = useMemo(() => {
    if (!editingTripId) return activeCarretas;
    const assigned = allCarretas.find((c) => c.placa === placaCarreta);
    if (assigned && assigned.ativo === false) {
      return [...activeCarretas, assigned];
    }
    return activeCarretas;
  }, [activeCarretas, allCarretas, editingTripId, placaCarreta]);


  const resetForm = () => {
    setData(new Date().toISOString().split('T')[0]);
    setMotoristaId(isMotorista && currentUser ? currentUser.id : activeMotoristas[0]?.id || '');
    setPlacaCavalo(activeCavalos[0]?.placa || '');
    setPlacaCarreta(activeCarretas[0]?.placa || '');
    setOrigem('');
    setDestino('');
    setTipoCarregamento('1_container');
    setContainer('');
    setContainer2('');
    setEditingTripId(null);
    setErrorMsg(null);
  };

  const handleOpenCreateModal = () => {
    if (!isMotorista && activeMotoristas.length === 0) {
      alert('Não há motoristas ativos na frota. Ative ou cadastre um motorista no Cadastro de Usuários antes de registrar viagens.');
      return;
    }
    if (activeCavalos.length === 0 || activeCarretas.length === 0) {
      alert('É necessário ter pelo menos um Cavalo e uma Carreta ativos na frota antes de registrar viagens. Caso estejam inativos, basta reativá-los no Cadastro de Veículos.');
      return;
    }
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (trip: Trip) => {
    setEditingTripId(trip.id);
    setData(trip.data);
    setMotoristaId(trip.motoristaId);
    setPlacaCavalo(trip.placaCavalo);
    setPlacaCarreta(trip.placaCarreta);
    setOrigem(trip.origem);
    setDestino(trip.destino);
    setTipoCarregamento(trip.tipoCarregamento || (trip.container2 ? '2_containers' : '1_container'));
    setContainer(trip.container || '');
    setContainer2(trip.container2 || '');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!data) {
      setErrorMsg('Informe a data da viagem.');
      return;
    }

    const effectiveMotoristaId = isMotorista && currentUser ? currentUser.id : motoristaId;
    if (!effectiveMotoristaId) {
      setErrorMsg('Selecione o motorista.');
      return;
    }
    if (!placaCavalo) {
      setErrorMsg('Selecione a placa do cavalo.');
      return;
    }
    if (!placaCarreta) {
      setErrorMsg('Selecione a placa da carreta.');
      return;
    }
    if (!origem.trim()) {
      setErrorMsg('Informe o local de origem.');
      return;
    }
    if (!destino.trim()) {
      setErrorMsg('Informe o local de destino.');
      return;
    }
    if (!container.trim()) {
      setErrorMsg(tipoCarregamento === '2_containers' ? 'Informe a identificação do 1º container.' : 'Informe a identificação do container.');
      return;
    }
    if (tipoCarregamento === '2_containers') {
      if (!container2.trim()) {
        setErrorMsg('Informe a identificação do 2º container para carregamento duplo na carreta.');
        return;
      }
      if (container.trim().toUpperCase() === container2.trim().toUpperCase()) {
        setErrorMsg('Os dois containers na mesma carreta não podem ter a mesma identificação.');
        return;
      }
    }

    const selectedMotorista = users.find((u) => u.id === effectiveMotoristaId);
    const motoristaNome = isMotorista && currentUser ? currentUser.nome : selectedMotorista ? selectedMotorista.nome : 'Motorista';

    const formattedContainer = formatContainer(container);
    const formattedContainer2 = tipoCarregamento === '2_containers' && container2.trim() ? formatContainer(container2) : undefined;

    if (editingTripId) {
      updateTrip(editingTripId, {
        data,
        motoristaId: effectiveMotoristaId,
        motoristaNome,
        placaCavalo,
        placaCarreta,
        origem: origem.trim(),
        destino: destino.trim(),
        tipoCarregamento,
        container: formattedContainer,
        container2: formattedContainer2,
      });
      setSuccessMsg('Viagem atualizada com sucesso!');
    } else {
      addTrip({
        data,
        motoristaId: effectiveMotoristaId,
        motoristaNome,
        placaCavalo,
        placaCarreta,
        origem: origem.trim(),
        destino: destino.trim(),
        tipoCarregamento,
        container: formattedContainer,
        container2: formattedContainer2,
      });
      setSuccessMsg(tipoCarregamento === '2_containers' ? 'Viagem com 2 containers lançada com sucesso!' : 'Viagem lançada com sucesso!');
    }

    setIsModalOpen(false);
    resetForm();
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Delete confirmation
  const [tripToDelete, setTripToDelete] = useState<{ id: string; container: string } | null>(null);

  const handleDelete = (id: string, tripContainer: string) => {
    setTripToDelete({ id, container: tripContainer });
  };

  const handleConfirmDelete = () => {
    if (!tripToDelete) return;
    deleteTrip(tripToDelete.id);
    setSuccessMsg(`Viagem com o container ${tripToDelete.container} removida com sucesso.`);
    setTimeout(() => setSuccessMsg(null), 3500);
    setTripToDelete(null);
  };

  const handleExportCSV = () => {
    if (isMotorista) return; // Anti-export protection for driver

    if (filteredTrips.length === 0) {
      alert('Nenhuma viagem para exportar.');
      return;
    }

    const headers = ['Data', 'Motorista', 'Placa Cavalo', 'Placa Carreta', 'Origem', 'Destino', 'Tipo de Carregamento', 'Container 1', 'Container 2'];
    const rows = filteredTrips.map((t) => [
      t.data,
      `"${t.motoristaNome}"`,
      t.placaCavalo,
      t.placaCarreta,
      `"${t.origem}"`,
      `"${t.destino}"`,
      t.container2 ? '"2 Containers (2x 20\')"' : '"1 Container"',
      `"${t.container}"`,
      `"${t.container2 || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_viagens_${periodFilter.mode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered trips (only from userVisibleTrips)
  const filteredTrips = userVisibleTrips.filter((t) => {
    const matchesPeriod = isTripInPeriod(t.data, periodFilter);
    const matchesMotorista = isMotorista || motoristaFilter === 'all' || t.motoristaId === motoristaFilter;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      t.container.toLowerCase().includes(term) ||
      (t.container2 && t.container2.toLowerCase().includes(term)) ||
      t.motoristaNome.toLowerCase().includes(term) ||
      t.placaCavalo.toLowerCase().includes(term) ||
      t.placaCarreta.toLowerCase().includes(term) ||
      t.origem.toLowerCase().includes(term) ||
      t.destino.toLowerCase().includes(term) ||
      t.data.includes(term);

    return matchesPeriod && matchesMotorista && matchesSearch;
  });

  const totalFilteredTrips = filteredTrips.length;
  const totalContainersTransportados = filteredTrips.reduce((acc, t) => acc + (t.container2 ? 2 : 1), 0);
  const containersSet = new Set<string>();
  filteredTrips.forEach((t) => {
    if (t.container) containersSet.add(t.container);
    if (t.container2) containersSet.add(t.container2);
  });
  const uniqueContainers = containersSet.size;
  const viagensDuploContainer = filteredTrips.filter((t) => !!t.container2).length;

  const handleSelectRouteForTrip = (selectedRoute: Route) => {
    setOrigem(selectedRoute.origem);
    setDestino(selectedRoute.destino);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Navigation className="w-5 h-5 text-blue-400" />
            <span>{isMotorista ? 'Minhas Viagens' : 'Controle de Viagem'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isMotorista
              ? `Visualização e lançamento das viagens realizadas por você (${currentUser?.nome})`
              : 'Registro e controle de viagens: data, motorista, placas, origem, destino e container'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isMotorista && (
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
              title="Exportar dados filtrados para CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
          )}

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{isMotorista ? 'Lançar Minha Viagem' : 'Nova Viagem'}</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-800/80 rounded-lg flex items-center gap-2.5 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-950/70 border border-red-800/80 rounded-lg flex items-center gap-2.5 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Period Filter: Mês Atual (Padrão Inicial), Mês Anterior, Seleção de Período por Data, Todos */}
      <PeriodFilter
        filter={periodFilter}
        onChange={setPeriodFilter}
        matchingCount={totalFilteredTrips}
        title={isMotorista ? 'Filtrar Minhas Viagens por Período:' : 'Filtro do Período de Viagens:'}
      />

      {/* Quick Metrics (Reflects the active period and driver restriction) */}
      <div className={`grid grid-cols-1 ${isMotorista ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-4`}>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">
            {isMotorista ? 'Minhas Viagens' : 'Viagens'} ({activePeriodLabel})
          </div>
          <div className="text-2xl font-bold text-white mt-1 font-mono tabular-nums">{totalFilteredTrips}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Viagens filtradas no período selecionado
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Containers ({activePeriodLabel})</div>
          <div className="text-2xl font-bold text-sky-400 mt-1 font-mono tabular-nums">{totalContainersTransportados}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {viagensDuploContainer > 0
              ? `${uniqueContainers} únicos · ${viagensDuploContainer} viagem(ns) com 2 containers`
              : (isMotorista ? `${uniqueContainers} containers transportados por você` : `${uniqueContainers} identificações únicas no período`)}
          </div>
        </div>

        {!isMotorista && (
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-xs text-slate-400 font-medium">Motoristas com Viagens</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono tabular-nums">
              {new Set(filteredTrips.map((t) => t.motoristaId)).size}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Com registro no período</div>
          </div>
        )}
      </div>

      {/* Controls Bar: Search & Driver filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              isMotorista
                ? 'Buscar por container, placa, rota ou data...'
                : 'Buscar por container, motorista, placa, rota ou data...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Driver filter (Only for Gestor) */}
        {!isMotorista && (
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={motoristaFilter}
              onChange={(e) => setMotoristaFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">Todos os Motoristas ({allMotoristas.length})</option>
              {allMotoristas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome} {m.ativo === false ? '(Inativo)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Trips Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Data</th>
                <th className="py-3 px-4 font-semibold">Motorista</th>
                <th className="py-3 px-4 font-semibold">Placa do Cavalo</th>
                <th className="py-3 px-4 font-semibold">Placa da Carreta</th>
                <th className="py-3 px-4 font-semibold">Origem</th>
                <th className="py-3 px-4 font-semibold">Destino</th>
                <th className="py-3 px-4 font-semibold">Container(s)</th>
                <th className="py-3 px-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    <p>Nenhuma viagem encontrada para o filtro selecionado ({activePeriodLabel}).</p>
                    {isMotorista && (
                      <p className="text-[11px] text-slate-600 mt-1">
                        Use o botão &quot;Lançar Minha Viagem&quot; acima para registrar uma nova viagem realizada por você.
                      </p>
                    )}
                    {periodFilter.mode !== 'all' && (
                      <button
                        onClick={() => setPeriodFilter({ mode: 'all', startDate: '', endDate: '' })}
                        className="mt-2 text-xs text-blue-400 hover:text-blue-300 font-medium underline"
                      >
                        Exibir todas as viagens (remover filtro de período)
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-300 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{formatDateBR(trip.data)}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-200 font-medium">
                      <span className="flex items-center gap-1.5">
                        {isMotorista && <UserIcon className="w-3 h-3 text-emerald-400" />}
                        <span>{trip.motoristaNome}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-amber-400 font-semibold whitespace-nowrap">
                      {trip.placaCavalo}
                    </td>

                    <td className="py-3 px-4 font-mono text-sky-400 font-semibold whitespace-nowrap">
                      {trip.placaCarreta}
                    </td>

                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                      {trip.origem}
                    </td>

                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                      {trip.destino}
                    </td>

                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      {trip.container2 ? (
                        <div className="flex flex-col gap-1 py-0.5">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-950/80 text-amber-300 border border-amber-800/80 w-fit">
                            <Layers className="w-3 h-3 text-amber-400" />
                            <span>2x 20' Carreta</span>
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-sky-950/70 border border-sky-800/70 rounded font-bold text-sky-400 text-xs">
                              <Package className="w-3 h-3 text-sky-400 shrink-0" />
                              <span className="text-[10px] font-sans text-slate-400">1:</span>
                              <span>{trip.container}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-sky-950/70 border border-sky-800/70 rounded font-bold text-sky-400 text-xs">
                              <Package className="w-3 h-3 text-sky-400 shrink-0" />
                              <span className="text-[10px] font-sans text-slate-400">2:</span>
                              <span>{trip.container2}</span>
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-950/60 border border-sky-800/60 rounded font-bold text-sky-400">
                          <Package className="w-3.5 h-3.5 text-sky-400" />
                          <span>{trip.container}</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(trip)}
                          title="Editar viagem"
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(trip.id, trip.container)}
                          title="Excluir viagem"
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Dialog for Create & Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <h3 className="text-base font-semibold text-white">
                {editingTripId
                  ? 'Editar Viagem'
                  : isMotorista
                  ? 'Lançar Minha Viagem'
                  : 'Cadastrar Nova Viagem'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-950/70 border border-red-800 rounded-lg text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Data */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Data da Viagem
                </label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Motorista: Auto-locked if driver, select if fleet manager */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Motorista
                </label>
                {isMotorista && currentUser ? (
                  <div className="w-full px-3 py-2 bg-slate-950 border border-emerald-800/80 rounded-lg text-xs text-slate-100 flex items-center justify-between">
                    <span className="font-semibold text-emerald-400">{currentUser.nome}</span>
                    <span className="text-[11px] text-slate-500 font-mono">CPF: {currentUser.cpf} (Seu Perfil)</span>
                  </div>
                ) : (
                  <select
                    value={motoristaId}
                    onChange={(e) => setMotoristaId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Selecione o motorista...</option>
                    {selectableMotoristas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome} (CPF: {m.cpf}){m.ativo === false ? ' [Inativo na Frota]' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Placa do Cavalo & Placa da Carreta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Placa do Cavalo
                  </label>
                  <select
                    value={placaCavalo}
                    onChange={(e) => setPlacaCavalo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Selecione a placa do cavalo...</option>
                    {selectableCavalos.map((v) => (
                      <option key={v.id} value={v.placa}>
                        {v.placa} ({v.tipo}){v.ativo === false ? ' [Inativo na Frota]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Placa da Carreta
                  </label>
                  <select
                    value={placaCarreta}
                    onChange={(e) => setPlacaCarreta(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Selecione a placa da carreta...</option>
                    {selectableCarretas.map((v) => (
                      <option key={v.id} value={v.placa}>
                        {v.placa} ({v.tipo}){v.ativo === false ? ' [Inativo na Frota]' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick pre-registered route selector */}
              {routes.length > 0 && (
                <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300 flex items-center gap-1.5">
                      <RouteIcon className="w-3.5 h-3.5 text-blue-400" />
                      <span>Preencher com Rota Cadastrada:</span>
                    </span>
                    <span className="text-[11px] text-slate-500">Selecione para preencher origem e destino</span>
                  </div>
                  <select
                    onChange={(e) => {
                      const selected = routes.find((r) => r.id === e.target.value);
                      if (selected) {
                        setOrigem(selected.origem);
                        setDestino(selected.destino);
                      }
                    }}
                    defaultValue=""
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="" disabled>Escolha uma rota para preencher Origem e Destino...</option>
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nome}: {r.origem} → {r.destino}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Origem */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Origem
                </label>
                <input
                  type="text"
                  value={origem}
                  onChange={(e) => setOrigem(e.target.value)}
                  placeholder="Ex: Santos, SP ou Porto de Santos - SP"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {COMMON_ORIGINS.slice(0, 3).map((orig) => (
                    <button
                      key={orig}
                      type="button"
                      onClick={() => setOrigem(orig)}
                      className="text-[10px] px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
                    >
                      {orig}
                    </button>
                  ))}
                </div>
              </div>

              {/* Destino */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Destino
                </label>
                <input
                  type="text"
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  placeholder="Ex: Campinas, SP ou Terminal Intermodal Campinas - SP"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {COMMON_DESTINATIONS.slice(0, 3).map((dest) => (
                    <button
                      key={dest}
                      type="button"
                      onClick={() => setDestino(dest)}
                      className="text-[10px] px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
                    >
                      {dest}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opção de Carregamento na Carreta: 1 ou 2 containers */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Tipo de Carregamento na Carreta
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoCarregamento('1_container')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      tipoCarregamento === '1_container'
                        ? 'bg-sky-950/60 border-sky-500 text-sky-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Package className="w-4 h-4 text-sky-400" />
                    <span>1 Container (40' ou 20')</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoCarregamento('2_containers')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      tipoCarregamento === '2_containers'
                        ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center -space-x-1">
                      <Package className="w-4 h-4 text-amber-400" />
                      <Package className="w-4 h-4 text-amber-400" />
                    </div>
                    <span>2 Containers (2x 20' Mesma Carreta)</span>
                  </button>
                </div>
              </div>

              {/* Informação / Inputs de Containers */}
              {tipoCarregamento === '1_container' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Identificação do Container
                  </label>
                  <div className="relative">
                    <Package className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={container}
                      onChange={(e) => setContainer(e.target.value.toUpperCase())}
                      placeholder="Ex: MSKU 782341-2 ou MEDU 491204-8"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 font-mono uppercase tracking-wider focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <span className="block text-[11px] text-slate-500 mt-1">
                    Padrão internacional BIC ISO 6346 (4 letras + 6 números + dígito verificador)
                  </span>
                </div>
              ) : (
                <div className="space-y-3 p-3.5 bg-slate-950/90 border border-amber-800/40 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <span>Carregamento Duplo: 2 Containers na Mesma Carreta</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/80 font-bold">
                      2x 20 Pés
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        1º Container (Frente / 20') *
                      </label>
                      <div className="relative">
                        <Package className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={container}
                          onChange={(e) => setContainer(e.target.value.toUpperCase())}
                          placeholder="Ex: MSKU 782341-2"
                          className="w-full pl-8 pr-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 font-mono uppercase tracking-wider focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        2º Container (Traseira / 20') *
                      </label>
                      <div className="relative">
                        <Package className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={container2}
                          onChange={(e) => setContainer2(e.target.value.toUpperCase())}
                          placeholder="Ex: MEDU 491204-8"
                          className="w-full pl-8 pr-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 font-mono uppercase tracking-wider focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Os 2 containers serão transportados juntos na carreta <span className="text-amber-400 font-mono font-bold">{placaCarreta || '(selecionar carreta)'}</span> nesta mesma viagem.
                  </p>
                </div>
              )}

              {/* Modal buttons */}
              <div className="pt-4 flex items-center justify-between gap-2 border-t border-slate-800">
                {editingTripId ? (
                  <button
                    type="button"
                    onClick={() => {
                      const trip = trips.find((t) => t.id === editingTripId);
                      if (trip) {
                        setIsModalOpen(false);
                        handleDelete(trip.id, trip.container2 ? `${trip.container} + ${trip.container2}` : trip.container);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Viagem</span>
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    {editingTripId
                      ? 'Salvar Alterações'
                      : isMotorista
                      ? 'Lançar Minha Viagem'
                      : 'Cadastrar Viagem'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={tripToDelete !== null}
        title="Excluir Viagem"
        message="Deseja realmente remover o registro desta viagem do sistema? Esta ação é irreversível."
        itemName={tripToDelete ? `Container: ${tripToDelete.container}` : undefined}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTripToDelete(null)}
      />
    </div>
  );
};
