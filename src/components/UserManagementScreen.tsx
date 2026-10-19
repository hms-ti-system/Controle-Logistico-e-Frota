import React, { useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { User, UserRole } from '../types/logistics';
import { formatCPF, formatPhone } from '../utils/formatters';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2,
  CheckCircle2, 
  AlertCircle, 
  X, 
  Shield, 
  Truck, 
  Power, 
  PowerOff,
  History
} from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export const UserManagementScreen: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, toggleUserStatus, setUserStatus, trips } = useLogistics();

  // Search & filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form fields
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [role, setRole] = useState<UserRole>('motorista');
  const [ativo, setAtivo] = useState(true);

  // Alerts
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetForm = () => {
    setNome('');
    setCpf('');
    setEmail('');
    setTelefone('');
    setRole('motorista');
    setAtivo(true);
    setEditingUserId(null);
    setErrorMsg(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUserId(user.id);
    setNome(user.nome);
    setCpf(user.cpf);
    setEmail(user.email);
    setTelefone(user.telefone);
    setRole(user.role);
    setAtivo(user.ativo !== false);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nome.trim()) {
      setErrorMsg('Informe o nome completo.');
      return;
    }
    if (!cpf.trim() || cpf.replace(/\D/g, '').length < 11) {
      setErrorMsg('Informe um CPF válido com 11 dígitos.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Informe um e-mail válido.');
      return;
    }
    if (!telefone.trim() || telefone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Informe um telefone com DDD.');
      return;
    }

    // Check duplicate CPF
    const existingCpf = users.find(
      (u) => u.cpf.replace(/\D/g, '') === cpf.replace(/\D/g, '') && u.id !== editingUserId
    );
    if (existingCpf) {
      setErrorMsg('Já existe um usuário cadastrado com este CPF.');
      return;
    }

    if (editingUserId) {
      updateUser(editingUserId, {
        nome: nome.trim(),
        cpf: formatCPF(cpf),
        email: email.trim().toLowerCase(),
        telefone: formatPhone(telefone),
        role,
        ativo,
      });
      setSuccessMsg('Usuário atualizado com sucesso!');
    } else {
      addUser({
        nome: nome.trim(),
        cpf: formatCPF(cpf),
        email: email.trim().toLowerCase(),
        telefone: formatPhone(telefone),
        role,
        ativo,
        senha: '123',
      });
      setSuccessMsg('Usuário cadastrado com sucesso!');
    }

    setIsModalOpen(false);
    resetForm();
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Status toggle confirmation
  const [statusModal, setStatusModal] = useState<{ user: User; targetAtivo: boolean } | null>(null);

  const handleConfirmStatusChange = () => {
    if (!statusModal) return;
    const res = setUserStatus(statusModal.user.id, statusModal.targetAtivo);
    if (!res.success) {
      setErrorMsg(res.message || 'Erro ao alterar status.');
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(res.message || 'Status atualizado com sucesso.');
      setTimeout(() => setSuccessMsg(null), 3500);
    }
    setStatusModal(null);
  };

  // Permanent Delete confirmation
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const handleConfirmDeleteUser = () => {
    if (!userToDelete) return;
    deleteUser(userToDelete.id);
    setSuccessMsg(`Usuário "${userToDelete.nome}" excluído com sucesso.`);
    setTimeout(() => setSuccessMsg(null), 3500);
    setUserToDelete(null);
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const isUserActive = u.ativo !== false;
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && isUserActive) ||
      (statusFilter === 'inactive' && !isUserActive);

    const term = searchTerm.toLowerCase().trim();
    const statusText = isUserActive ? 'ativo' : 'inativo';
    const matchesSearch =
      !term ||
      u.nome.toLowerCase().includes(term) ||
      u.cpf.includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.telefone.includes(term) ||
      statusText.includes(term);

    return matchesRole && matchesStatus && matchesSearch;
  });

  const totalAtivos = users.filter((u) => u.ativo !== false).length;
  const totalInativos = users.filter((u) => u.ativo === false).length;
  const totalMotoristasAtivos = users.filter((u) => u.role === 'motorista' && u.ativo !== false).length;
  const totalMotoristas = users.filter((u) => u.role === 'motorista').length;
  const totalGestoresAtivos = users.filter((u) => u.role === 'gestor' && u.ativo !== false).length;
  const totalGestores = users.filter((u) => u.role === 'gestor').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-5 h-5 text-blue-400" />
            <span>Cadastro de Usuários</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestão de motoristas e gestores da frota autorizados no sistema
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shadow-sm self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Usuário</span>
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
          <div className="text-xs text-slate-400 font-medium">Total de Usuários</div>
          <div className="text-2xl font-bold text-white mt-1 font-mono tabular-nums">{users.length}</div>
          <div className="text-xs text-slate-500 mt-1">
            <span className="text-emerald-400 font-semibold">{totalAtivos} ativos</span> · <span className="text-slate-400">{totalInativos} inativos</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Motoristas Cadastrados</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono tabular-nums">{totalMotoristasAtivos}</div>
          <div className="text-xs text-slate-500 mt-1">
            {totalMotoristasAtivos} ativos de {totalMotoristas} no histórico
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Gestores da Frota</div>
          <div className="text-2xl font-bold text-blue-400 mt-1 font-mono tabular-nums">{totalGestoresAtivos}</div>
          <div className="text-xs text-slate-500 mt-1">
            {totalGestoresAtivos} ativos de {totalGestores} cadastrados
          </div>
        </div>
      </div>

      {/* Controls Bar: Search & Role / Status Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF, e-mail ou status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
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
              Todos ({users.length})
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

          {/* Role Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                roleFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos Perfis
            </button>
            <button
              onClick={() => setRoleFilter('motorista')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                roleFilter === 'motorista'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Motoristas
            </button>
            <button
              onClick={() => setRoleFilter('gestor')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                roleFilter === 'gestor'
                  ? 'bg-slate-800 text-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Gestores
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Nome</th>
                <th className="py-3 px-4 font-semibold">Perfil</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">CPF</th>
                <th className="py-3 px-4 font-semibold">E-mail</th>
                <th className="py-3 px-4 font-semibold">Telefone</th>
                <th className="py-3 px-4 font-semibold text-center">Viagens</th>
                <th className="py-3 px-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Nenhum usuário encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const userTripsCount = trips.filter((t) => t.motoristaId === user.id).length;
                  const isGestor = user.role === 'gestor';
                  const isUserActive = user.ativo !== false;

                  return (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-slate-800/40 transition-colors ${
                        !isUserActive ? 'bg-slate-950/40 opacity-80' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-slate-200 font-medium">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                              isGestor
                                ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            }`}
                          >
                            {user.nome.charAt(0)}
                          </div>
                          <div>
                            <span className={!isUserActive ? 'text-slate-400' : 'text-slate-200'}>
                              {user.nome}
                            </span>
                            {!isUserActive && (
                              <span className="block text-[10px] text-amber-500/80 font-normal">
                                Histórico mantido
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1.5 text-xs text-slate-300">
                          {isGestor ? (
                            <>
                              <Shield className="w-3.5 h-3.5 text-blue-400" />
                              <span>Gestor da frota</span>
                            </>
                          ) : (
                            <>
                              <Truck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Motorista</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isUserActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Ativo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-amber-400 border border-amber-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>Inativo</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-300">{user.cpf}</td>
                      <td className="py-3 px-4 text-slate-400">{user.email}</td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-300">{user.telefone}</td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-400">
                        {isGestor ? '—' : userTripsCount}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(user)}
                            title="Editar usuário"
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Activate / Inactivate button (preserves history) */}
                          {isUserActive ? (
                            <button
                              type="button"
                              onClick={() => setStatusModal({ user, targetAtivo: false })}
                              title="Inativar usuário (preserva histórico de viagens)"
                              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-950/40 rounded transition-colors cursor-pointer"
                            >
                              <PowerOff className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setStatusModal({ user, targetAtivo: true })}
                              title="Reativar usuário para a frota"
                              className="p-1.5 text-amber-400 hover:text-emerald-400 hover:bg-emerald-950/40 rounded transition-colors cursor-pointer"
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => setUserToDelete(user)}
                            title="Excluir usuário permanentemente"
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
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">
                {editingUserId ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}
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
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
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
                  Usuários inativos mantêm todo o histórico de viagens e podem ser reativados a qualquer momento.
                </p>
              </div>

              {/* Role selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Tipo de Perfil
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('motorista')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      role === 'motorista'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>Motorista</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('gestor')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      role === 'gestor'
                        ? 'bg-blue-950/60 border-blue-500 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Gestor da frota</span>
                  </button>
                </div>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Carlos Eduardo Silva"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* CPF */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  CPF
                </label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 font-mono tabular-nums focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@logistica.com.br"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Telefone
                </label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 font-mono tabular-nums focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Modal buttons */}
              <div className="pt-4 flex items-center justify-between gap-2 border-t border-slate-800">
                {editingUserId ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const user = users.find((u) => u.id === editingUserId);
                        if (user) {
                          setIsModalOpen(false);
                          setStatusModal({ user, targetAtivo: user.ativo === false });
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
                          <span>Inativar Usuário</span>
                        </>
                      ) : (
                        <>
                          <Power className="w-3.5 h-3.5" />
                          <span>Reativar Usuário</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const user = users.find((u) => u.id === editingUserId);
                        if (user) {
                          setIsModalOpen(false);
                          setUserToDelete(user);
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir Usuário</span>
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
                    {editingUserId ? 'Salvar Alterações' : 'Cadastrar Usuário'}
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
        title={statusModal?.targetAtivo ? 'Reativar Usuário na Frota' : 'Inativar Usuário da Frota'}
        message={
          statusModal?.targetAtivo
            ? 'Deseja reativar este usuário para a frota? Ele voltará a ficar disponível para novas viagens e acessos.'
            : 'Deseja realmente inativar este usuário? O histórico de viagens realizadas continuará 100% preservado no sistema. Caso o usuário retorne para a frota, basta ativá-lo novamente a qualquer momento.'
        }
        itemName={
          statusModal
            ? `${statusModal.user.nome} (${statusModal.user.role === 'gestor' ? 'Gestor' : 'Motorista'})`
            : undefined
        }
        confirmLabel={statusModal?.targetAtivo ? 'Sim, Reativar Usuário' : 'Sim, Inativar Usuário'}
        variant={statusModal?.targetAtivo ? 'success' : 'warning'}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setStatusModal(null)}
      />

      {/* Confirmation Dialog for Permanent User Deletion */}
      <ConfirmDeleteModal
        isOpen={userToDelete !== null}
        title="Excluir Usuário"
        message={
          userToDelete && trips.some((t) => t.motoristaId === userToDelete.id)
            ? 'Atenção: Este usuário possui viagens registradas no sistema. Se deseja apenas suspendê-lo sem perder o histórico, recomendamos a opção "Inativar". Deseja realmente excluir este usuário de forma definitiva?'
            : 'Deseja realmente excluir este usuário do sistema? Esta ação é irreversível.'
        }
        itemName={userToDelete ? `${userToDelete.nome} (${userToDelete.email})` : undefined}
        confirmLabel="Sim, Excluir Usuário"
        variant="danger"
        onConfirm={handleConfirmDeleteUser}
        onCancel={() => setUserToDelete(null)}
      />
    </div>
  );
};

