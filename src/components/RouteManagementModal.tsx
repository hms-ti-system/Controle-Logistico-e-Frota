import React, { useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { Route } from '../types/logistics';
import { formatCurrencyBR } from '../utils/formatters';
import { 
  MapPin, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Route as RouteIcon,
  Coins
} from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface RouteManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoute?: (route: Route) => void;
}

export const RouteManagementModal: React.FC<RouteManagementModalProps> = ({
  isOpen,
  onClose,
  onSelectRoute,
}) => {
  const { routes, addRoute, updateRoute, deleteRoute } = useLogistics();

  // Search & view mode
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);

  // Form fields strictly: Nome da rota, Origem (cidade, estado), Destino (cidade, estado), Valor do Frete
  const [nome, setNome] = useState('');
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [valorFrete, setValorFrete] = useState('');

  // Messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setNome('');
    setOrigem('');
    setDestino('');
    setValorFrete('');
    setEditingRouteId(null);
    setErrorMsg(null);
  };

  const handleOpenCreateForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (route: Route) => {
    setEditingRouteId(route.id);
    setNome(route.nome);
    setOrigem(route.origem);
    setDestino(route.destino);
    setValorFrete(route.valorFrete !== undefined ? String(route.valorFrete) : '');
    setErrorMsg(null);
    setIsFormOpen(true);
  };

  const handleCancelForm = () => {
    resetForm();
    setIsFormOpen(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nome.trim()) {
      setErrorMsg('Informe o nome da rota.');
      return;
    }
    if (!origem.trim()) {
      setErrorMsg('Informe a origem (cidade, estado). Ex: Santos, SP');
      return;
    }
    if (!destino.trim()) {
      setErrorMsg('Informe o destino (cidade, estado). Ex: Campinas, SP');
      return;
    }

    let parsedFrete: number | undefined = undefined;
    if (valorFrete.trim()) {
      const cleaned = valorFrete.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
      const num = Number(cleaned);
      if (isNaN(num) || num < 0) {
        setErrorMsg('Informe um valor de frete válido (R$) maior ou igual a zero.');
        return;
      }
      parsedFrete = num;
    }

    if (editingRouteId) {
      updateRoute(editingRouteId, {
        nome: nome.trim(),
        origem: origem.trim(),
        destino: destino.trim(),
        valorFrete: parsedFrete,
      });
      setSuccessMsg('Rota atualizada com sucesso!');
    } else {
      addRoute({
        nome: nome.trim(),
        origem: origem.trim(),
        destino: destino.trim(),
        valorFrete: parsedFrete,
      });
      setSuccessMsg('Rota cadastrada com sucesso!');
    }

    setIsFormOpen(false);
    resetForm();
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Delete confirmation
  const [routeToDelete, setRouteToDelete] = useState<{ id: string; nome: string } | null>(null);

  const handleDelete = (id: string, routeNome: string) => {
    setRouteToDelete({ id, nome: routeNome });
  };

  const handleConfirmDelete = () => {
    if (!routeToDelete) return;
    deleteRoute(routeToDelete.id);
    setSuccessMsg(`Rota "${routeToDelete.nome}" removida com sucesso.`);
    setTimeout(() => setSuccessMsg(null), 3000);
    setRouteToDelete(null);
  };

  const filteredRoutes = routes.filter((r) => {
    const term = searchTerm.toLowerCase().trim();
    return (
      !term ||
      r.nome.toLowerCase().includes(term) ||
      r.origem.toLowerCase().includes(term) ||
      r.destino.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <RouteIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Cadastro de Rotas</h2>
              <p className="text-xs text-slate-400">Gerenciamento simplificado de rotas logísticas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
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

          {/* Form (Add / Edit Route) */}
          {isFormOpen ? (
            <form onSubmit={handleSave} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  {editingRouteId ? 'Editar Rota' : 'Nova Rota'}
                </h3>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
              </div>

              {/* Nome da rota */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nome da Rota
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Santos x Campinas ou Linha Expressa Sudeste"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Origem e Destino */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Origem (cidade, estado)
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={origem}
                      onChange={(e) => setOrigem(e.target.value)}
                      placeholder="Ex: Santos, SP"
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Destino (cidade, estado)
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={destino}
                      onChange={(e) => setDestino(e.target.value)}
                      placeholder="Ex: Campinas, SP"
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Valor do Frete (R$) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Valor do Frete (R$) <span className="text-[11px] text-slate-500 font-normal">(Opcional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-400 font-mono">
                    R$
                  </span>
                  <input
                    type="text"
                    value={valorFrete}
                    onChange={(e) => setValorFrete(e.target.value)}
                    placeholder="Ex: 3850,00"
                    className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Form buttons */}
              <div className="pt-2 flex items-center justify-between gap-2">
                {editingRouteId ? (
                  <button
                    type="button"
                    onClick={() => {
                      const r = routes.find((item) => item.id === editingRouteId);
                      if (r) {
                        setIsFormOpen(false);
                        handleDelete(r.id, r.nome);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg text-xs font-medium transition-colors cursor-pointer"
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
                    onClick={handleCancelForm}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    {editingRouteId ? 'Salvar Alterações' : 'Cadastrar Rota'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Search and New Route Action */
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar rotas por nome, origem ou destino..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={handleOpenCreateForm}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Rota</span>
              </button>
            </div>
          )}

          {/* Routes List Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Nome da Rota</th>
                    <th className="py-3 px-4 font-semibold">Origem</th>
                    <th className="py-3 px-4 font-semibold">Destino</th>
                    <th className="py-3 px-4 font-semibold text-right">Valor Frete</th>
                    <th className="py-3 px-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRoutes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        Nenhuma rota encontrada.
                      </td>
                    </tr>
                  ) : (
                    filteredRoutes.map((route) => (
                      <tr key={route.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 text-slate-100 font-medium">
                          {route.nome}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span>{route.origem}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{route.destino}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {route.valorFrete !== undefined && route.valorFrete > 0 ? (
                            <span className="font-mono text-emerald-400 font-semibold">
                              {formatCurrencyBR(route.valorFrete)}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onSelectRoute && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectRoute(route);
                                  onClose();
                                }}
                                title="Usar esta rota na viagem"
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 rounded text-[11px] font-medium flex items-center gap-1 mr-1 transition-colors"
                              >
                                <span>Selecionar</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenEditForm(route)}
                              title="Editar rota"
                              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(route.id, route.nome)}
                              title="Excluir rota"
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
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>{routes.length} rotas cadastradas no sistema</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={routeToDelete !== null}
        title="Excluir Rota"
        message="Tem certeza que deseja remover esta rota cadastrada do sistema?"
        itemName={routeToDelete?.nome}
        onConfirm={handleConfirmDelete}
        onCancel={() => setRouteToDelete(null)}
      />
    </div>
  );
};
