import React, { useMemo } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { 
  BarChart3, 
  Navigation, 
  Truck, 
  Users, 
  LogOut, 
  ShieldCheck, 
  User as UserIcon,
  Menu,
  X,
  Route as RouteIcon,
  Wrench,
  Fuel,
  Sun,
  Moon
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'trips' | 'maintenance' | 'fuel' | 'vehicles' | 'users' | 'routes';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const { currentUser, logout, maintenancePlans, vehicles, theme, toggleTheme } = useLogistics();

  const isMotorista = currentUser?.role === 'motorista';

  // Count overdue maintenance items for badge
  const overdueCount = useMemo(() => {
    if (!maintenancePlans || isMotorista) return 0;
    const vMap = new Map(vehicles.map(v => [v.placa, v.kmAtual || 0]));
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayTime = new Date(todayStr).getTime();

    return maintenancePlans.filter(p => {
      if (p.tipoVeiculo === 'Cavalo') {
        const kmAtual = vMap.get(p.placa) || 0;
        const proxima = p.kmProximaManutencao || 0;
        return (proxima - kmAtual) <= 0;
      } else {
        const proximaData = p.dataProximaManutencao;
        if (!proximaData) return false;
        return new Date(proximaData).getTime() <= todayTime;
      }
    }).length;
  }, [maintenancePlans, vehicles, isMotorista]);

  // Drivers have access to 'trips' (Minhas Viagens) and 'fuel' (Abastecimento)
  const navItems = isMotorista
    ? [
        { id: 'trips' as const, label: 'Minhas Viagens', icon: Navigation },
        { id: 'fuel' as const, label: 'Abastecimento', icon: Fuel },
      ]
    : [
        { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
        { id: 'trips' as const, label: 'Viagens', icon: Navigation },
        { 
          id: 'maintenance' as const, 
          label: 'Manutenção', 
          icon: Wrench,
          badge: overdueCount > 0 ? overdueCount : undefined
        },
        { id: 'fuel' as const, label: 'Abastecimento', icon: Fuel },
        { id: 'vehicles' as const, label: 'Veículos', icon: Truck },
        { id: 'users' as const, label: 'Usuários', icon: Users },
        { id: 'routes' as const, label: 'Rotas', icon: RouteIcon },
      ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      {/* Top Bar Contract: 3 zones */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element Brand Zone */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab(isMotorista ? 'trips' : 'dashboard');
            }}
            className="flex items-center gap-2.5 text-base font-bold tracking-tight text-white whitespace-nowrap"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <span>Controle Logístico</span>
          </a>
        </div>

        {/* Zone 2: Navigation (desktop) */}
        <nav className="hidden md:flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-red-600 text-white leading-tight">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: User Info and Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300 pl-3 border-l border-slate-800">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold text-xs">
                {isMotorista ? (
                  <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                )}
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className="font-medium text-slate-200 truncate max-w-[130px]">{currentUser.nome}</span>
                <span className="text-[10px] text-slate-400">
                  {isMotorista ? 'Motorista' : 'Gestor da frota'}
                </span>
              </div>
            </div>
          )}

          {/* Theme Toggle Button (Claro / Escuro) */}
          <button
            onClick={toggleTheme}
            type="button"
            title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline text-[11px] font-semibold">Tema Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-sky-500" />
                <span className="hidden lg:inline text-[11px] font-semibold text-slate-700">Tema Escuro</span>
              </>
            )}
          </button>

          <button
            onClick={logout}
            title="Sair do sistema"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-1">
          {currentUser && (
            <div className="pb-2 mb-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <div>
                <div className="font-semibold text-white">{currentUser.nome}</div>
                <div className="text-slate-400 text-[11px]">
                  {isMotorista ? 'Motorista' : 'Gestor da frota'} · {currentUser.email}
                </div>
              </div>

              {/* Theme toggle in mobile */}
              <button
                onClick={toggleTheme}
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-sky-500" />
                    <span>Escuro</span>
                  </>
                )}
              </button>
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-600 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
