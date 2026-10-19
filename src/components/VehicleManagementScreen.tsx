import React, { useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { Vehicle, VehicleType } from '../types/logistics';
import { formatPlate } from '../utils/formatters';
import { 
  Truck, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldAlert, 
  Power, 
  PowerOff
} from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export const VehicleManagementScreen: React.FC = () => {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle, toggleVehicleStatus, setVehicleStatus, trips } = useLogistics();

  // Search & filters
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<'all' | VehicleType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);

  // Form fields: Placa, Tipo, Modelo and Ativo
  const [placa, setPlaca] = useState('');
  const [tipo, setTipo] = useState<VehicleType>('Cavalo');
  const [modelo, setModelo] = useState('');
  const [ativo, setAtivo] = useState(true);

  // Messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetForm = () => {
    setPlaca('');
    setTipo('Cavalo');
    setModelo('');
    setAtivo(true);
    setEditingVehicleId(null);
    setErrorMsg(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (vehicle: Vehicle) => {
    setEditingVehicleId(vehicle.id);
    setPlaca(vehicle.placa);
    setTipo(vehicle.tipo);
    setModelo(vehicle.modelo || '');
    setAtivo(vehicle.ativo !== false);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPlate = formatPlate(placa);
    if (!cleanPlate || cleanPlate.length < 7) {
      setErrorMsg('Informe uma placa válida com 7 caracteres (padrão Mercosul ou tradicional).');
      return;
    }

    // Check duplicate
    const existing = vehicles.find(
      (v) => v.placa === cleanPlate && v.id !== editingVehicleId
    );
    if (existing) {
      setErrorMsg('Já existe um veículo cadastrado com esta placa.');
      return;
    }

    const currentVeh = vehicles.find((v) => v.id === editingVehicleId);
    if (editingVehicleId) {
      updateVehicle(editingVehicleId, {
        placa: cleanPlate,
        tipo,
        modelo: modelo.trim() || undefined,
        kmAtual: tipo === 'Cavalo' ? currentVeh?.kmAtual : undefined,
        ativo,
      });
      setSuccessMsg('Veículo atualizado com sucesso!');
    } else {
      addVehicle({
        placa: cleanPlate,
        tipo,
        modelo: modelo.trim() || undefined,
        ativo,
      });
      setSuccessMsg('Veículo cadastrado com sucesso!');
    }

    setIsModalOpen(false);
    resetForm();
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Status toggle confirmation
  const [statusModal, setStatusModal] = useState<{ vehicle: Vehicle; targetAtivo: boolean } | null>(null);

  const handleConfirmStatusChange = () => {
    if (!statusModal) return;
    const res = setVehicleStatus(statusModal.vehicle.id, statusModal.targetAtivo);
    if (!res.success) {
      setErrorMsg(res.message || 'Erro ao alterar status do veículo.');
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(res.message || 'Status do veículo atualizado com sucesso.');
      setTimeout(() => setSuccessMsg(null), 3500);
    }
    setStatusModal(null);
  };

  // Permanent Delete confirmation
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  const handleConfirmDeleteVehicle = () => {
    if (!vehicleToDelete) return;
    deleteVehicle(vehicleToDelete.id);
    setSuccessMsg(`Veículo placa "${vehicleToDelete.placa}" excluído com sucesso.`);
    setTimeout(() => setSuccessMsg(null), 3500);
    setVehicleToDelete(null);
  };

  // Filtered vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const isVehicleActive = v.ativo !== false;
    const matchesTipo = tipoFilter === 'all' || v.tipo === tipoFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && isVehicleActive) ||
      (statusFilter === 'inactive' && !isVehicleActive);

    const term = searchTerm.toUpperCase().trim();
    const statusText = isVehicleActive ? 'ATIVO' : 'INATIVO';
    const matchesSearch = !term || v.placa.includes(term) || v.tipo.toUpperCase().includes(term) || statusText.includes(term);

    return matchesTipo && matchesStatus && matchesSearch;
  });

  const totalAtivos = vehicles.filter((v) => v.ativo !== false).length;
  const totalInativos = vehicles.filter((v) => v.ativo === false).length;
  const totalCavalosAtivos = vehicles.filter((v) => v.tipo === 'Cavalo' && v.ativo !== false).length;
  const totalCavalos = vehicles.filter((v) => v.tipo === 'Cavalo').length;
  const totalCarretasAtivas = vehicles.filter((v) => v.tipo === 'Carreta' && v.ativo !== false).length;
  const totalCarretas = vehicles.filter((v) => v.tipo === 'Carreta').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Truck className="w-5 h-5 text-amber-400" />
            <span>Cadastro de Veículos</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Controle de frota: Placa e Tipo (Cavalo ou Carreta)
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Veículo</span>
        </button>
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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Frota Total Cadastrada</div>
          <div className="text-2xl font-bold text-white mt-1 font-mono tabular-nums">{vehicles.length}</div>
          <div className="text-xs text-slate-500 mt-1">
            <span className="text-emerald-400 font-semibold">{totalAtivos} ativos</span> · <span className="text-slate-400">{totalInativos} inativos</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Cavalos (Tratores)</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 font-mono tabular-nums">{totalCavalosAtivos}</div>
          <div className="text-xs text-slate-500 mt-1">
            {totalCavalosAtivos} ativos de {totalCavalos} cadastrados
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Carretas (Porta-Containers)</div>
          <div className="text-2xl font-bold text-sky-400 mt-1 font-mono tabular-nums">{totalCarretasAtivas}</div>
          <div className="text-xs text-slate-500 mt-1">
            {totalCarretasAtivas} ativas de {totalCarretas} cadastradas
          </div>
        </div>
      </div>

      {/* Controls Bar: Search & Type / Status Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por placa, tipo ou status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 uppercase placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({vehicles.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'active'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Ativos ({totalAtivos})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-slate-800 text-amber-300 border border-amber-800/60'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              Inativos ({totalInativos})
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              onClick={() => setTipoFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                tipoFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos Tipos
            </button>
            <button
              onClick={() => setTipoFilter('Cavalo')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                tipoFilter === 'Cavalo'
                  ? 'bg-slate-800 text-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cavalos
            </button>
            <button
              onClick={() => setTipoFilter('Carreta')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                tipoFilter === 'Carreta'
                  ? 'bg-slate-800 text-sky-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Carretas
            </button>
          </div>
        </div>
      </div>

      {/* Vehicles Table (Placa, Tipo, Status, Ações) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Placa / Modelo</th>
                <th className="py-3 px-4 font-semibold">Tipo</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    Nenhum veículo encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => {
                  const isVehicleActive = vehicle.ativo !== false;

                  return (
                    <tr 
                      key={vehicle.id} 
                      className={`hover:bg-slate-800/40 transition-colors ${
                        !isVehicleActive ? 'bg-slate-950/40 opacity-80' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-slate-100 font-mono font-bold text-sm tracking-wider">
                        <div className="flex items-center gap-2">
                          <span className="inline-block px-2.5 py-1 bg-slate-950 border border-slate-700 rounded text-slate-200">
                            {vehicle.placa}
                          </span>
                          <div className="flex flex-col">
                            {vehicle.modelo && (
                              <span className="text-xs font-sans font-medium text-slate-300">
                                {vehicle.modelo}
                              </span>
                            )}
                            {!isVehicleActive && (
                              <span className="text-[10px] text-amber-500/80 font-normal">
                                Histórico mantido
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 font-medium ${
                            vehicle.tipo === 'Cavalo' ? 'text-amber-400' : 'text-sky-400'
                          }`}
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>{vehicle.tipo}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isVehicleActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Ativo na Frota</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-amber-400 border border-amber-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>Inativo</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(vehicle)}
                            title="Editar veículo"
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Inactivate / Reactivate button */}
                          {isVehicleActive ? (
                            <button
                              type="button"
                              onClick={() => setStatusModal({ vehicle, targetAtivo: false })}
                              title="Inativar veículo (preserva histórico de viagens)"
                              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-950/40 rounded transition-colors cursor-pointer"
                            >
                              <PowerOff className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setStatusModal({ vehicle, targetAtivo: true })}
                              title="Reativar veículo para a frota"
                              className="p-1.5 text-amber-400 hover:text-emerald-400 hover:bg-emerald-950/40 rounded transition-colors cursor-pointer"
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => setVehicleToDelete(vehicle)}
                            title="Excluir veículo permanentemente"
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Dialog for Create & Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">
                {editingVehicleId ? 'Editar Veículo' : 'Cadastrar Novo Veículo'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-950/70 border border-red-800 rounded-lg text-xs text-red-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Status Selection (Ativo / Inativo) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Situação na Frota
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAtivo(true)}
                    className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      ativo
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Ativo na Frota</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAtivo(false)}
                    className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      !ativo
                        ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <PowerOff className="w-4 h-4 text-amber-400" />
                    <span>Inativo (Histórico Preservado)</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Veículos inativos mantêm todo o histórico de viagens e podem ser reativados a qualquer momento.
                </p>
              </div>

              {/* Placa */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Placa do Veículo
                </label>
                <input
                  type="text"
                  value={placa}
                  onChange={(e) => setPlaca(formatPlate(e.target.value))}
                  placeholder="Ex: BRA2E19 ou ABC1234"
                  maxLength={7}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 font-mono uppercase tracking-wider focus:outline-none focus:border-blue-500"
                />
                <span className="block text-[11px] text-slate-500 mt-1">
                  7 caracteres alfanuméricos (Padrão Mercosul ou Tradicional)
                </span>
              </div>

              {/* Tipo (Cavalo ou Carreta) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Tipo (Cavalo ou Carreta)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipo('Cavalo')}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      tipo === 'Cavalo'
                        ? 'bg-amber-950/40 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Truck className="w-5 h-5 mb-1" />
                    <span>Cavalo</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 font-normal">Caminhão trator</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo('Carreta')}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      tipo === 'Carreta'
                        ? 'bg-sky-950/40 border-sky-500 text-sky-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Truck className="w-5 h-5 mb-1" />
                    <span>Carreta</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 font-normal">Porta-container</span>
                  </button>
                </div>
              </div>

              {/* Modelo */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Modelo / Fabricante (Opcional)
                </label>
                <input
                  type="text"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  placeholder="Ex: Scania R 450 6x2 ou Randon Porta-Container"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Modal buttons */}
              <div className="pt-4 flex items-center justify-between gap-2 border-t border-slate-800">
                {editingVehicleId ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const veh = vehicles.find((v) => v.id === editingVehicleId);
                        if (veh) {
                          setIsModalOpen(false);
                          setStatusModal({ vehicle: veh, targetAtivo: veh.ativo === false });
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        ativo
                          ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/40'
                          : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40'
                      }`}
                    >
                      {ativo ? (
                        <>
                          <PowerOff className="w-3.5 h-3.5" />
                          <span>Inativar Veículo</span>
                        </>
                      ) : (
                        <>
                          <Power className="w-3.5 h-3.5" />
                          <span>Reativar Veículo</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const veh = vehicles.find((v) => v.id === editingVehicleId);
                        if (veh) {
                          setIsModalOpen(false);
                          setVehicleToDelete(veh);
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir Veículo</span>
                    </button>
                  </div>
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
                    {editingVehicleId ? 'Salvar Alterações' : 'Cadastrar Veículo'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Inactivating or Reactivating */}
      <ConfirmDeleteModal
        isOpen={statusModal !== null}
        title={statusModal?.targetAtivo ? 'Reativar Veículo na Frota' : 'Inativar Veículo da Frota'}
        message={
          statusModal?.targetAtivo
            ? 'Deseja reativar este veículo para a frota ativa? Ele voltará a ficar disponível para novos lançamentos de viagens.'
            : 'Deseja realmente inativar este veículo? Todo o histórico de viagens realizadas continuará 100% preservado no sistema. Caso o veículo retorne para a frota, basta ativá-lo novamente a qualquer momento.'
        }
        itemName={statusModal ? `Placa: ${statusModal.vehicle.placa} (${statusModal.vehicle.tipo})` : undefined}
        confirmLabel={statusModal?.targetAtivo ? 'Sim, Reativar Veículo' : 'Sim, Inativar Veículo'}
        variant={statusModal?.targetAtivo ? 'success' : 'warning'}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setStatusModal(null)}
      />

      {/* Confirmation Dialog for Permanent Vehicle Deletion */}
      <ConfirmDeleteModal
        isOpen={vehicleToDelete !== null}
        title="Excluir Veículo"
        message={
          vehicleToDelete && trips.some((t) => t.placaCavalo === vehicleToDelete.placa || t.placaCarreta === vehicleToDelete.placa)
            ? 'Atenção: Este veículo possui viagens registradas no sistema. Se você deseja apenas suspendê-lo sem perder o histórico operacional, recomendamos a opção "Inativar". Deseja realmente excluir este veículo de forma definitiva?'
            : 'Deseja realmente excluir este veículo do cadastro? Esta ação é irreversível.'
        }
        itemName={vehicleToDelete ? `Placa: ${vehicleToDelete.placa} (${vehicleToDelete.tipo})` : undefined}
        confirmLabel="Sim, Excluir Veículo"
        variant="danger"
        onConfirm={handleConfirmDeleteVehicle}
        onCancel={() => setVehicleToDelete(null)}
      />
    </div>
  );
};

