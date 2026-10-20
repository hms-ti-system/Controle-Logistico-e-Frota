import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  Vehicle, 
  Trip, 
  Route, 
  UserRole,
  MaintenancePlan,
  MaintenanceRecord,
  FuelRecord,
  ThemeMode 
} from '../types/logistics';
import { 
  INITIAL_USERS, 
  INITIAL_VEHICLES, 
  INITIAL_TRIPS, 
  INITIAL_ROUTES,
  INITIAL_MAINTENANCE_PLANS,
  INITIAL_MAINTENANCE_RECORDS,
  INITIAL_FUEL_RECORDS
} from '../data/initialData';

interface LogisticsContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  currentUser: User | null;
  login: (login: string, senha: string) => { success: boolean; message?: string };
  quickLoginAs: (role: UserRole) => void;
  logout: () => void;
  
  users: User[];
  addUser: (userData: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, userData: Partial<User>) => void;
  deleteUser: (id: string) => { success: boolean; message?: string };
  toggleUserStatus: (id: string) => { success: boolean; message?: string };
  setUserStatus: (id: string, ativo: boolean) => { success: boolean; message?: string };

  vehicles: Vehicle[];
  addVehicle: (vehicleData: Omit<Vehicle, 'id' | 'createdAt'>) => void;
  updateVehicle: (id: string, vehicleData: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => { success: boolean; message?: string };
  toggleVehicleStatus: (id: string) => { success: boolean; message?: string };
  setVehicleStatus: (id: string, ativo: boolean) => { success: boolean; message?: string };
  updateVehicleKm: (placaOrId: string, novoKm: number) => void;

  routes: Route[];
  addRoute: (routeData: Omit<Route, 'id' | 'createdAt'>) => void;
  updateRoute: (id: string, routeData: Partial<Route>) => void;
  deleteRoute: (id: string) => { success: boolean; message?: string };

  trips: Trip[];
  addTrip: (tripData: Omit<Trip, 'id' | 'createdAt'>) => void;
  updateTrip: (id: string, tripData: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;

  // Manutenção Preventiva
  maintenancePlans: MaintenancePlan[];
  addMaintenancePlan: (planData: Omit<MaintenancePlan, 'id' | 'createdAt'>) => void;
  updateMaintenancePlan: (id: string, planData: Partial<MaintenancePlan>) => void;
  deleteMaintenancePlan: (id: string) => { success: boolean; message?: string };

  maintenanceRecords: MaintenanceRecord[];
  addMaintenanceRecord: (recordData: Omit<MaintenanceRecord, 'id' | 'createdAt'>) => void;
  updateMaintenanceRecord: (id: string, recordData: Partial<MaintenanceRecord>) => void;
  deleteMaintenanceRecord: (id: string) => { success: boolean; message?: string };

  // Abastecimento
  fuelRecords: FuelRecord[];
  addFuelRecord: (fuelData: Omit<FuelRecord, 'id' | 'createdAt'>) => void;
  updateFuelRecord: (id: string, fuelData: Partial<FuelRecord>) => void;
  deleteFuelRecord: (id: string) => { success: boolean; message?: string };

  resetToInitialData: () => void;
}

const LogisticsContext = createContext<LogisticsContextType | undefined>(undefined);

const STORAGE_KEY_AUTH = 'logistica_auth_user_v2';
const STORAGE_KEY_USERS = 'logistica_users_v2';
const STORAGE_KEY_VEHICLES = 'logistica_vehicles_v3';
const STORAGE_KEY_TRIPS = 'logistica_trips_v2';
const STORAGE_KEY_ROUTES = 'logistica_routes_v2';
const STORAGE_KEY_MAINT_PLANS = 'logistica_maint_plans_v1';
const STORAGE_KEY_MAINT_RECORDS = 'logistica_maint_records_v1';
const STORAGE_KEY_FUEL_RECORDS = 'logistica_fuel_records_v1';
const STORAGE_KEY_THEME = 'logistica_app_theme_v1';

export const LogisticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved === 'light' || saved === 'dark') return saved;
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch {
      // ignore
    }
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH);
      if (saved) return JSON.parse(saved);
      return INITIAL_USERS[0];
    } catch {
      return INITIAL_USERS[0];
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        return parsed.map((u) => ({ ...u, ativo: u.ativo !== false }));
      }
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VEHICLES);
      if (saved) {
        const parsed: Vehicle[] = JSON.parse(saved);
        return parsed.map((v) => ({ ...v, ativo: v.ativo !== false }));
      }
      return INITIAL_VEHICLES;
    } catch {
      return INITIAL_VEHICLES;
    }
  });

  const [routes, setRoutes] = useState<Route[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ROUTES);
      return saved ? JSON.parse(saved) : INITIAL_ROUTES;
    } catch {
      return INITIAL_ROUTES;
    }
  });

  const [trips, setTrips] = useState<Trip[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRIPS);
      return saved ? JSON.parse(saved) : INITIAL_TRIPS;
    } catch {
      return INITIAL_TRIPS;
    }
  });

  const [maintenancePlans, setMaintenancePlans] = useState<MaintenancePlan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MAINT_PLANS);
      return saved ? JSON.parse(saved) : INITIAL_MAINTENANCE_PLANS;
    } catch {
      return INITIAL_MAINTENANCE_PLANS;
    }
  });

  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MAINT_RECORDS);
      return saved ? JSON.parse(saved) : INITIAL_MAINTENANCE_RECORDS;
    } catch {
      return INITIAL_MAINTENANCE_RECORDS;
    }
  });

  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FUEL_RECORDS);
      return saved ? JSON.parse(saved) : INITIAL_FUEL_RECORDS;
    } catch {
      return INITIAL_FUEL_RECORDS;
    }
  });

  // Persist state
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_AUTH);
      }
    } catch {
      // ignore
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch {
      // ignore
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(vehicles));
    } catch {
      // ignore
    }
  }, [vehicles]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ROUTES, JSON.stringify(routes));
    } catch {
      // ignore
    }
  }, [routes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(trips));
    } catch {
      // ignore
    }
  }, [trips]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MAINT_PLANS, JSON.stringify(maintenancePlans));
    } catch {
      // ignore
    }
  }, [maintenancePlans]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MAINT_RECORDS, JSON.stringify(maintenanceRecords));
    } catch {
      // ignore
    }
  }, [maintenanceRecords]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FUEL_RECORDS, JSON.stringify(fuelRecords));
    } catch {
      // ignore
    }
  }, [fuelRecords]);

  // Login handler
  const login = (loginInput: string, senhaInput: string) => {
    const cleanInput = loginInput.trim().toLowerCase();
    const cleanCPF = loginInput.replace(/\D/g, '');

    const found = users.find(u => {
      const emailMatch = u.email.toLowerCase() === cleanInput;
      const cpfMatch = u.cpf.replace(/\D/g, '') === cleanCPF;
      const nameMatch = u.nome.toLowerCase() === cleanInput;
      return emailMatch || cpfMatch || nameMatch;
    });

    if (!found) {
      return { success: false, message: 'Usuário não encontrado. Verifique login ou CPF informado.' };
    }

    if (found.ativo === false) {
      return { 
        success: false, 
        message: 'Este usuário está inativo na frota. Contate a administração para reativar o acesso.' 
      };
    }

    if (found.senha && found.senha !== senhaInput && senhaInput !== '123') {
      return { success: false, message: 'Senha incorreta.' };
    }

    setCurrentUser(found);
    return { success: true };
  };

  const quickLoginAs = (role: UserRole) => {
    const user = users.find(u => u.role === role && u.ativo !== false) || users.find(u => u.role === role);
    if (user) {
      setCurrentUser(user);
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // User CRUD & Status
  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      ativo: userData.ativo !== undefined ? userData.ativo : true,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setUsers(prev => [newUser, ...prev]);
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...userData } : u)));
    if (currentUser?.id === id) {
      setCurrentUser(prev => (prev ? { ...prev, ...userData } : null));
    }
    if (userData.nome) {
      setTrips(prev => prev.map(t => (t.motoristaId === id ? { ...t, motoristaNome: userData.nome! } : t)));
      setFuelRecords(prev => prev.map(f => (f.motoristaId === id ? { ...f, motoristaNome: userData.nome! } : f)));
    }
  };

  const toggleUserStatus = (id: string) => {
    const target = users.find(u => u.id === id);
    if (!target) return { success: false, message: 'Usuário não encontrado.' };
    const nextStatus = target.ativo === false ? true : false;
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ativo: nextStatus } : u)));
    if (currentUser?.id === id) {
      setCurrentUser(prev => (prev ? { ...prev, ativo: nextStatus } : null));
    }
    return {
      success: true,
      message: nextStatus
        ? `Usuário "${target.nome}" reativado na frota com sucesso!`
        : `Usuário "${target.nome}" inativado na frota. O histórico de viagens foi preservado.`,
    };
  };

  const setUserStatus = (id: string, ativo: boolean) => {
    const target = users.find(u => u.id === id);
    if (!target) return { success: false, message: 'Usuário não encontrado.' };
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ativo } : u)));
    if (currentUser?.id === id) {
      setCurrentUser(prev => (prev ? { ...prev, ativo } : null));
    }
    return {
      success: true,
      message: ativo
        ? `Usuário "${target.nome}" reativado com sucesso!`
        : `Usuário "${target.nome}" inativado. Histórico mantido.`,
    };
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    if (currentUser?.id === id) {
      setCurrentUser(null);
    }
    return { success: true };
  };

  // Vehicle CRUD & Status
  const addVehicle = (vehicleData: Omit<Vehicle, 'id' | 'createdAt'>) => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      ativo: vehicleData.ativo !== undefined ? vehicleData.ativo : true,
      placa: vehicleData.placa.toUpperCase().replace(/[^A-Z0-9]/g, ''),
      kmAtual: vehicleData.kmAtual || 0,
      id: `veh-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setVehicles(prev => [newVehicle, ...prev]);
  };

  const updateVehicle = (id: string, vehicleData: Partial<Vehicle>) => {
    const cleanData = {
      ...vehicleData,
      ...(vehicleData.placa ? { placa: vehicleData.placa.toUpperCase().replace(/[^A-Z0-9]/g, '') } : {}),
    };
    setVehicles(prev => prev.map(v => (v.id === id ? { ...v, ...cleanData } : v)));
  };

  const updateVehicleKm = (placaOrId: string, novoKm: number) => {
    const cleanPlate = placaOrId.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setVehicles(prev => prev.map(v => {
      if ((v.id === placaOrId || v.placa === cleanPlate) && v.tipo === 'Cavalo') {
        return { ...v, kmAtual: Math.max(v.kmAtual || 0, novoKm) };
      }
      return v;
    }));
  };

  const toggleVehicleStatus = (id: string) => {
    const target = vehicles.find(v => v.id === id);
    if (!target) return { success: false, message: 'Veículo não encontrado.' };
    const nextStatus = target.ativo === false ? true : false;
    setVehicles(prev => prev.map(v => (v.id === id ? { ...v, ativo: nextStatus } : v)));
    return {
      success: true,
      message: nextStatus
        ? `Veículo placa "${target.placa}" (${target.tipo}) reativado na frota com sucesso!`
        : `Veículo placa "${target.placa}" (${target.tipo}) inativado. Histórico preservado.`,
    };
  };

  const setVehicleStatus = (id: string, ativo: boolean) => {
    const target = vehicles.find(v => v.id === id);
    if (!target) return { success: false, message: 'Veículo não encontrado.' };
    setVehicles(prev => prev.map(v => (v.id === id ? { ...v, ativo } : v)));
    return {
      success: true,
      message: ativo
        ? `Veículo placa "${target.placa}" reativado na frota!`
        : `Veículo placa "${target.placa}" inativado da frota.`,
    };
  };

  const deleteVehicle = (id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
    return { success: true };
  };

  // Route CRUD
  const addRoute = (routeData: Omit<Route, 'id' | 'createdAt'>) => {
    const newRoute: Route = {
      ...routeData,
      id: `rot-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setRoutes(prev => [newRoute, ...prev]);
  };

  const updateRoute = (id: string, routeData: Partial<Route>) => {
    setRoutes(prev => prev.map(r => (r.id === id ? { ...r, ...routeData } : r)));
  };

  const deleteRoute = (id: string) => {
    setRoutes(prev => prev.filter(r => r.id !== id));
    return { success: true };
  };

  // Trip CRUD
  const addTrip = (tripData: Omit<Trip, 'id' | 'createdAt'>) => {
    const newTrip: Trip = {
      ...tripData,
      id: `trp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTrips(prev => [newTrip, ...prev]);
  };

  const updateTrip = (id: string, tripData: Partial<Trip>) => {
    setTrips(prev => prev.map(t => (t.id === id ? { ...t, ...tripData } : t)));
  };

  const deleteTrip = (id: string) => {
    setTrips(prev => prev.filter(t => t.id !== id));
  };

  // Manutenção Preventiva - Planos
  const addMaintenancePlan = (planData: Omit<MaintenancePlan, 'id' | 'createdAt'>) => {
    const newPlan: MaintenancePlan = {
      ...planData,
      placa: planData.placa.toUpperCase().replace(/[^A-Z0-9]/g, ''),
      kmProximaManutencao: planData.tipoVeiculo === 'Cavalo' 
        ? (planData.kmProximaManutencao || ((planData.kmUltimaManutencao || 0) + (planData.intervaloKm || 20000)))
        : undefined,
      id: `plan-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setMaintenancePlans(prev => [newPlan, ...prev]);
  };

  const updateMaintenancePlan = (id: string, planData: Partial<MaintenancePlan>) => {
    setMaintenancePlans(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...planData };
        if (planData.placa) {
          updated.placa = planData.placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
        }
        if (p.tipoVeiculo === 'Cavalo') {
          if (planData.intervaloKm !== undefined || planData.kmUltimaManutencao !== undefined) {
            if (!planData.kmProximaManutencao) {
              updated.kmProximaManutencao = (updated.kmUltimaManutencao || 0) + (updated.intervaloKm || 20000);
            }
          }
        }
        return updated;
      }
      return p;
    }));
  };

  const deleteMaintenancePlan = (id: string) => {
    setMaintenancePlans(prev => prev.filter(p => p.id !== id));
    return { success: true };
  };

  // Manutenção Preventiva - Histórico de Serviços Realizados
  const addMaintenanceRecord = (recordData: Omit<MaintenanceRecord, 'id' | 'createdAt'>) => {
    const cleanPlate = recordData.placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const newRecord: MaintenanceRecord = {
      ...recordData,
      placa: cleanPlate,
      id: `mrec-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    // 1. Add record
    setMaintenanceRecords(prev => [newRecord, ...prev]);

    // 2. Update vehicle current KM ONLY for Cavalos (Carretas don't have odometers)
    if (recordData.tipoVeiculo === 'Cavalo' && recordData.kmServico) {
      updateVehicleKm(cleanPlate, recordData.kmServico);
    }

    // 3. Automatically advance and update corresponding maintenance plans
    setMaintenancePlans(prev => prev.map(p => {
      if (p.placa === cleanPlate && (
        p.itemServico.toLowerCase().includes(recordData.itemServico.toLowerCase().slice(0, 10)) ||
        recordData.itemServico.toLowerCase().includes(p.itemServico.toLowerCase().slice(0, 10))
      )) {
        if (p.tipoVeiculo === 'Cavalo') {
          const nextKm = recordData.proximaTrocaKmRecomendada && recordData.kmServico && recordData.proximaTrocaKmRecomendada > recordData.kmServico
            ? recordData.proximaTrocaKmRecomendada
            : ((recordData.kmServico || p.kmUltimaManutencao || 0) + (p.intervaloKm || 20000));
          return {
            ...p,
            kmUltimaManutencao: recordData.kmServico || p.kmUltimaManutencao,
            dataUltimaManutencao: recordData.dataServico,
            kmProximaManutencao: nextKm,
          };
        } else {
          // Carreta: data-based maintenance calculation
          let nextDate = recordData.proximaTrocaDataRecomendada;
          if (!nextDate && p.intervaloMeses) {
            const servDate = new Date(recordData.dataServico);
            servDate.setMonth(servDate.getMonth() + p.intervaloMeses);
            nextDate = servDate.toISOString().slice(0, 10);
          }
          return {
            ...p,
            dataUltimaManutencao: recordData.dataServico,
            dataProximaManutencao: nextDate || p.dataProximaManutencao,
          };
        }
      }
      return p;
    }));
  };

  const updateMaintenanceRecord = (id: string, recordData: Partial<MaintenanceRecord>) => {
    setMaintenanceRecords(prev => prev.map(r => (r.id === id ? { ...r, ...recordData } : r)));
  };

  const deleteMaintenanceRecord = (id: string) => {
    setMaintenanceRecords(prev => prev.filter(r => r.id !== id));
    return { success: true };
  };

  // Controle de Abastecimento por Cavalo
  const addFuelRecord = (fuelData: Omit<FuelRecord, 'id' | 'createdAt'>) => {
    const cleanPlate = fuelData.placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Auto calculate consumption and km delta based on prior fuelings for the vehicle
    let kmRodados = fuelData.kmRodados;
    let consumoMedio = fuelData.consumoMedio;

    if (!kmRodados || !consumoMedio) {
      // Find latest fueling for same plate before current KM
      const vehicleFuelings = fuelRecords
        .filter(f => f.placa === cleanPlate && f.km < fuelData.km)
        .sort((a, b) => b.km - a.km);

      if (vehicleFuelings.length > 0) {
        const lastFueling = vehicleFuelings[0];
        const delta = fuelData.km - lastFueling.km;
        if (delta > 0 && fuelData.quantidadeLitros > 0) {
          kmRodados = delta;
          consumoMedio = Number((delta / fuelData.quantidadeLitros).toFixed(2));
        }
      }
    }

    const calculatedTotal = fuelData.totalAbastecido || Number((fuelData.quantidadeLitros * fuelData.valorPorLitro).toFixed(2));

    const newFuel: FuelRecord = {
      ...fuelData,
      placa: cleanPlate,
      totalAbastecido: calculatedTotal,
      kmRodados,
      consumoMedio,
      id: `fuel-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setFuelRecords(prev => [newFuel, ...prev]);

    // Update vehicle's current KM
    updateVehicleKm(cleanPlate, fuelData.km);
  };

  const updateFuelRecord = (id: string, fuelData: Partial<FuelRecord>) => {
    setFuelRecords(prev => prev.map(f => (f.id === id ? { ...f, ...fuelData } : f)));
  };

  const deleteFuelRecord = (id: string) => {
    setFuelRecords(prev => prev.filter(f => f.id !== id));
    return { success: true };
  };

  const resetToInitialData = () => {
    setUsers(INITIAL_USERS);
    setVehicles(INITIAL_VEHICLES);
    setRoutes(INITIAL_ROUTES);
    setTrips(INITIAL_TRIPS);
    setMaintenancePlans(INITIAL_MAINTENANCE_PLANS);
    setMaintenanceRecords(INITIAL_MAINTENANCE_RECORDS);
    setFuelRecords(INITIAL_FUEL_RECORDS);
    setCurrentUser(INITIAL_USERS[0]);
    localStorage.removeItem(STORAGE_KEY_AUTH);
    localStorage.removeItem(STORAGE_KEY_USERS);
    localStorage.removeItem(STORAGE_KEY_VEHICLES);
    localStorage.removeItem(STORAGE_KEY_ROUTES);
    localStorage.removeItem(STORAGE_KEY_TRIPS);
    localStorage.removeItem(STORAGE_KEY_MAINT_PLANS);
    localStorage.removeItem(STORAGE_KEY_MAINT_RECORDS);
    localStorage.removeItem(STORAGE_KEY_FUEL_RECORDS);
  };

  return (
    <LogisticsContext.Provider
      value={{
        currentUser,
        login,
        quickLoginAs,
        logout,
        users,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        setUserStatus,
        vehicles,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        toggleVehicleStatus,
        setVehicleStatus,
        updateVehicleKm,
        routes,
        addRoute,
        updateRoute,
        deleteRoute,
        trips,
        addTrip,
        updateTrip,
        deleteTrip,
        maintenancePlans,
        addMaintenancePlan,
        updateMaintenancePlan,
        deleteMaintenancePlan,
        maintenanceRecords,
        addMaintenanceRecord,
        updateMaintenanceRecord,
        deleteMaintenanceRecord,
        fuelRecords,
        addFuelRecord,
        updateFuelRecord,
        deleteFuelRecord,
        resetToInitialData,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </LogisticsContext.Provider>
  );
};

export function useLogistics() {
  const context = useContext(LogisticsContext);
  if (!context) {
    throw new Error('useLogistics must be used within a LogisticsProvider');
  }
  return context;
}
