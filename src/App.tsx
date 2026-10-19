import React, { useState, useEffect } from 'react';
import { LogisticsProvider, useLogistics } from './context/LogisticsContext';
import { LoginScreen } from './components/LoginScreen';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardScreen } from './components/DashboardScreen';
import { TripControlScreen } from './components/TripControlScreen';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import { FuelControlScreen } from './components/FuelControlScreen';
import { VehicleManagementScreen } from './components/VehicleManagementScreen';
import { UserManagementScreen } from './components/UserManagementScreen';
import { RouteManagementScreen } from './components/RouteManagementScreen';
import { AntiScreenshotShield } from './components/AntiScreenshotShield';

const MainLayout: React.FC = () => {
  const { currentUser } = useLogistics();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isMotorista = currentUser?.role === 'motorista';

  // Drivers can view 'trips' (Minhas Viagens) and 'fuel' (Abastecimento)
  useEffect(() => {
    if (isMotorista && activeTab !== 'trips' && activeTab !== 'fuel') {
      setActiveTab('trips');
    }
  }, [isMotorista, activeTab]);

  // If not authenticated, show Login Screen
  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <AntiScreenshotShield enabled={isMotorista}>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* Top Bar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (isMotorista) {
              if (tab === 'fuel') setActiveTab('fuel');
              else setActiveTab('trips');
            } else {
              setActiveTab(tab);
            }
          }}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Main Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Driver: Trips or Fuel */}
          {isMotorista ? (
            <>
              {activeTab === 'trips' && <TripControlScreen />}
              {activeTab === 'fuel' && <FuelControlScreen />}
            </>
          ) : (
            <>
              {activeTab === 'dashboard' && <DashboardScreen onNavigate={(tab) => setActiveTab(tab)} />}
              {activeTab === 'trips' && <TripControlScreen />}
              {activeTab === 'maintenance' && <MaintenanceScreen />}
              {activeTab === 'fuel' && <FuelControlScreen />}
              {activeTab === 'vehicles' && <VehicleManagementScreen />}
              {activeTab === 'users' && <UserManagementScreen />}
              {activeTab === 'routes' && <RouteManagementScreen />}
            </>
          )}
        </main>

        {/* Clean quiet footer */}
        <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Sistema de Controle Logístico · Gestão de Viagens, Manutenção, Combustível e Frotas</span>
            <span className="font-mono text-[11px] text-slate-600">
              Transporte Rodoviário de Cargas
            </span>
          </div>
        </footer>
      </div>
    </AntiScreenshotShield>
  );
};

export default function App() {
  return (
    <LogisticsProvider>
      <MainLayout />
    </LogisticsProvider>
  );
}
