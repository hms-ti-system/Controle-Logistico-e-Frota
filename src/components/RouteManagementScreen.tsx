import React, { useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { Route } from '../types/logistics';
import { 
  Route as RouteIcon, 
  MapPin, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Navigation,
  ArrowRight
} from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

const SUGGESTED_ORIGINS = [
  'Santos, SP',
  'Paranaguá, PR',
  'Itajaí, SC',
  'Rio Grande, RS',
  'Cubatão, SP',
  'Suape, PE',
];

const SUGGESTED_DESTINATIONS = [
  'Campinas, SP',
  'Betim, MG',
  'Curitiba, PR',
  'Triunfo, RS',
  'São Paulo, SP',
  'Goiana, PE',
];

export const RouteManagementScreen: React.FC = () => {
  const { routes, trips, addRoute, updateRoute, deleteRoute } = useLogistics();

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);

  // Form fields
  const [nome, setNome] = useState('');
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');

  // Messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Delete modal state
  const [routeToDelete, setRouteToDelete] = useState<Route | null>(null);

  const resetForm = () => {
    setNome('');
    setOrigem('');
    setDestino('');
    setEditingRouteId(null);
    setErrorMsg(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (route: Route) => {
    setEditingRouteId(route.id);
    setNome(route.nome);
    setOrigem(route.origem);
    setDestino(route.destino);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nome.trim()) {
      setErrorMsg('Informe o nome da rota (Ex: Santos x Campinas).');
      return;
    }
    if (!origem.trim()) {
      setErrorMsg('Informe a cidade e estado de origem (Ex: Santos, SP).');
      return;
    }
    if (!destino.trim()) {
      setErrorMsg('Informe a cidade e estado de destino (Ex: Campinas, SP).');
      return;
    }

    if (editingRouteId) {
      updateRoute(editingRouteId, {
        nome: nome.trim(),
        origem: origem.trim(),
        destino: destino.trim(),
      });
      setSuccessMsg('Rota atualizada com sucesso!');
    } else {
      addRoute({
        nome: nome.trim(),
        origem: origem.trim(),
        destino: destino.trim(),
      });
      setSuccessMsg('Rota cadastrada com sucesso!');
    }

    setIsModalOpen(false);
    resetForm();
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleDelete = (route: Route) => {
    setRouteToDelete(route);
  };

  const handleConfirmDelete = () => {
    if (!routeToDelete) return;
    deleteRoute(routeToDelete.id);
    setSuccessMsg(`Rota "${routeToDelete.nome}" excluída com sucesso.`);
    setTimeout(() => setSuccessMsg(null), 3500);
    setRouteToDelete(null);
  };

  // Filtered routes
  const filteredRoutes = routes.filter((r) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      r.nome.toLowerCase().includes(term) ||
      r.origem.toLowerCase().includes(term) ||
      r.destino.toLowerCase().includes(term)
    );
  });

  // Calculate trips per route (matching origin and destination)
  const getTripsCountForRoute = (route: Route) => {
    return trips.filter((t) => {
      const origMatch = t.origem.toLowerCase().includes(route.origem.toLowerCase()) || 
                        route.origem.toLowerCase().includes(t.origem.toLowerCase());
      const destMatch = t.destino.toLowerCase().includes(route.destino.toLowerCase()) || 
                        route.destino.toLowerCase().includes(t.destino.toLowerCase());
      return origMatch && destMatch;
    }).length;
  };

  // Unique origins and destinations
  const uniqueOriginsCount = new Set(routes.map((r) => r.origem.trim().toLowerCase())).size;
  const uniqueDestinationsCount = new Set(routes.map((r) => r.destino.trim().toLowerCase())).size;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <RouteIcon className="w-5 h-5 text-blue-400" />
            <span>Cadastro e Gestão de Rotas</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gerenciamento de trajetos logísticos, cidades de origem e destino para preenchimento de viagens
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Rota</span>
        </button>
      </div>

      {/* Notifications */}
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
          <div className="text-xs text-slate-400 font-medium">Total de Rotas Cadastradas</div>
          <div className="text-2xl font-bold text-white mt-1 font-mono tabular-nums">{routes.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Disponíveis para preenchimento de viagens</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Cidades de Origem</div>
          <div className="text-2xl font-bold text-blue-400 mt-1 font-mono tabular-nums">{uniqueOriginsCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Pontos de embarque e portos cadastrados</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Cidades de Destino</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono tabular-nums">{uniqueDestinationsCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Terminais e pólos industriais atendidos</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar rotas por nome, origem ou destino..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-slate-400 hover:text-white px-2 py-1"
          >
            Limpar Busca
          </button>
        )}
      </div>

      {/* Routes Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Nome da Rota</th>
                <th className="py-3 px-4 font-semibold">Origem (Embarque)</th>
                <th className="py-3 px-4 font-semibold">Destino (Entrega)</th>
                <th className="py-3 px-4 font-semibold text-center">Viagens Relacionadas</th>
                <th className="py-3 px-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRoutes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">
                    <RouteIcon className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="text-slate-400 font-medium">Nenhuma rota encontrada</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {searchTerm ? 'Tente buscar com outros termos.' : 'Clique em "Nova Rota" acima para cadastrar a primeira rota.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRoutes.map((route) => {
                  const tripsCount = getTripsCountForRoute(route);

                  return (
                    <tr key={route.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-100 font-semibold">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400 shrink-0">
                            <Navigation className="w-3.5 h-3.5" />
                          </div>
                          <span>{route.nome}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg">
                          <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>{route.origem}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{route.destino}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-400">
                        {tripsCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-950/50 border border-blue-800/50 text-blue-300 rounded font-semibold text-[11px]">
                            {tripsCount} {tripsCount === 1 ? 'viagem' : 'viagens'}
                          </span>
                        ) : (
                          <span className="text-slate-600">0 viagens</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(route)}
                            title="Editar rota"
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(route)}
                            title="Excluir rota"
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
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <RouteIcon className="w-4 h-4 text-blue-400" />
                <span>{editingRouteId ? 'Editar Rota' : 'Cadastrar Nova Rota'}</span>
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

              {/* Nome da Rota */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nome da Rota
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Santos x Campinas ou Linha Expressa Sudeste"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Origem */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Origem (cidade, estado)
                  </label>
                  <span className="text-[11px] text-slate-500">Ex: Santos, SP</span>
                </div>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={origem}
                    onChange={(e) => setOrigem(e.target.value)}
                    placeholder="Ex: Santos, SP"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className="text-[10px] text-slate-500 py-0.5">Sugestões:</span>
                  {SUGGESTED_ORIGINS.slice(0, 4).map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setOrigem(sug)}
                      className="text-[10px] px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Destino */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Destino (cidade, estado)
                  </label>
                  <span className="text-[11px] text-slate-500">Ex: Campinas, SP</span>
                </div>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    placeholder="Ex: Campinas, SP"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className="text-[10px] text-slate-500 py-0.5">Sugestões:</span>
                  {SUGGESTED_DESTINATIONS.slice(0, 4).map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setDestino(sug)}
                      className="text-[10px] px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal buttons */}
              <div className="pt-4 flex items-center justify-between gap-2 border-t border-slate-800">
                {editingRouteId ? (
                  <button
                    type="button"
                    onClick={() => {
                      const r = routes.find((item) => item.id === editingRouteId);
                      if (r) {
                        setIsModalOpen(false);
                        handleDelete(r);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Rota</span>
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
                    {editingRouteId ? 'Salvar Alterações' : 'Cadastrar Rota'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Route Deletion */}
      <ConfirmDeleteModal
        isOpen={routeToDelete !== null}
        title="Excluir Rota"
        message="Tem certeza que deseja excluir esta rota do cadastro de rotas? As viagens já registradas que usaram esta rota manterão seus dados preservados."
        itemName={routeToDelete ? `${routeToDelete.nome} (${routeToDelete.origem} → ${routeToDelete.destino})` : undefined}
        confirmLabel="Sim, Excluir Rota"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setRouteToDelete(null)}
      />
    </div>
  );
};
