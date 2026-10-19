import React, { useState, useMemo } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { 
  MaintenancePlan, 
  MaintenanceRecord, 
  MaintenanceStatus, 
  MaintenanceType, 
  VehicleType 
} from '../types/logistics';
import { 
  formatDateBR, 
  formatKM, 
  formatCurrencyBR, 
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
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  Download, 
  Edit2, 
  Trash2, 
  X, 
  Truck, 
  FileText, 
  History, 
  AlertCircle,
  Calendar
} from 'lucide-react';

const COMMON_HORSE_ITEMS = [
  'Troca de Óleo de Motor e Filtros (Lubrificante, Combustível e Ar)',
  'Revisão e Regulagem de Freios / Lonas do Cavalo',
  'Lubrificação Geral de Chassi e Quinta Roda',
  'Troca de Óleo da Caixa de Câmbio e Diferencial',
  'Revisão Periódica / Concessionária',
  'Substituição do Elemento Filtrante Racor e Filtro APU',
  'Revisão do Sistema Elétrico, Alternador e Baterias',
  'Troca das Correias do Motor e Tensores'
];

const COMMON_TRAILER_ITEMS = [
  'Revisão das Cuícas de Freio (Spring Brake) e Tambores da Carreta',
  'Lubrificação Geral de Eixos, Mancais e Suspensão',
  'Inspeção e Lubrificação dos Twist-Locks (Travas de Container)',
  'Alinhamento dos Eixos e Rodízio de Pneus da Carreta',
  'Inspeção do Pino Rei, Mesa de Engate e Pés de Apoio',
  'Revisão do Sistema Pneumático e Válvulas Relé',
  'Inspeção Visual e Teste de Iluminação / Faixas Refletivas'
];

export const MaintenanceScreen: React.FC = () => {
  const { 
    vehicles, 
    maintenancePlans, 
    addMaintenancePlan, 
    updateMaintenancePlan, 
    deleteMaintenancePlan,
    maintenanceRecords, 
    addMaintenanceRecord, 
    updateMaintenanceRecord, 
    deleteMaintenanceRecord,
  } = useLogistics();

  // Active top subtab: only 'alerts' (Planos & Alertas) and 'history' (Histórico de Serviços)
  const [activeTab, setActiveTab] = useState<'alerts' | 'history'>('alerts');

  // Search & filters for Planos & Alertas
  const [planSearch, setPlanSearch] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<'all' | VehicleType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | MaintenanceStatus>('all');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('all');

  // Search & filters for Histórico
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | MaintenanceType>('all');
  const [historyVehicleFilter, setHistoryVehicleFilter] = useState<string>('all');
  const [historyPeriodFilter, setHistoryPeriodFilter] = useState<PeriodFilterState>(getInitialPeriodFilter());

  // Modal: Plan (New / Edit)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planPlaca, setPlanPlaca] = useState('');
  const [planItemServico, setPlanItemServico] = useState('');
  // Cavalo fields (KM)
  const [planIntervaloKm, setPlanIntervaloKm] = useState<number>(20000);
  const [planKmUltima, setPlanKmUltima] = useState<number>(0);
  const [planToleranciaKm, setPlanToleranciaKm] = useState<number>(1000);
  // Carreta fields (Periodicidade por Meses)
  const [planIntervaloMeses, setPlanIntervaloMeses] = useState<number>(6);
  const [planDataProxima, setPlanDataProxima] = useState<string>('');
  // Common
  const [planDataUltima, setPlanDataUltima] = useState(new Date().toISOString().slice(0, 10));
  const [planObservacoes, setPlanObservacoes] = useState('');
  const [planError, setPlanError] = useState<string | null>(null);

  // Modal: Service Record (New / Edit)
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [recPlaca, setRecPlaca] = useState('');
  const [recData, setRecData] = useState(new Date().toISOString().slice(0, 10));
  const [recKm, setRecKm] = useState<number | ''>('');
  const [recTipo, setRecTipo] = useState<MaintenanceType>('Preventiva');
  const [recItem, setRecItem] = useState('');
  const [recOficina, setRecOficina] = useState('');
  const [recMecanico, setRecMecanico] = useState('');
  const [recDescricao, setRecDescricao] = useState('');
  const [recCusto, setRecCusto] = useState<number>(0);
  const [recNF, setRecNF] = useState('');
  const [recProximaTrocaKm, setRecProximaTrocaKm] = useState<number | undefined>(undefined);
  const [recProximaTrocaData, setRecProximaTrocaData] = useState<string>('');
  const [recError, setRecError] = useState<string | null>(null);

  // Modal: Delete confirmation
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    type: 'plan' | 'record';
    id: string;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'plan',
    id: '',
    title: '',
    message: '',
  });

  // Feedback notifications
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Map vehicles by plate
  const vehicleMap = useMemo(() => {
    const map = new Map<string, typeof vehicles[0]>();
    vehicles.forEach(v => map.set(v.placa, v));
    return map;
  }, [vehicles]);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Compute status and details for each maintenance plan
  // Cavalos: use KM / Odômetro
  // Carretas: use Periodicidade por Data (carretas NÃO possuem odômetro)
  const plansWithStatus = useMemo(() => {
    const todayTime = new Date(todayStr).getTime();

    return maintenancePlans.map(plan => {
      const veh = vehicleMap.get(plan.placa);
      const isCavalo = plan.tipoVeiculo === 'Cavalo';

      let status: MaintenanceStatus = 'em_dia';
      let kmAtual: number | undefined = undefined;
      let kmRestante = 0;
      let percentProgresso = 0;
      let diasRestantes = 0;

      if (isCavalo) {
        kmAtual = veh?.kmAtual ?? 0;
        const proxima = plan.kmProximaManutencao || 0;
        kmRestante = proxima - kmAtual;
        const tolerancia = plan.toleranciaAlertaKm ?? 1000;

        if (kmRestante <= 0) {
          status = 'vencido';
        } else if (kmRestante <= tolerancia) {
          status = 'proximo';
        } else {
          status = 'em_dia';
        }

        const totalInterval = plan.intervaloKm || 1;
        const kmDesdeUltima = kmAtual - (plan.kmUltimaManutencao || 0);
        percentProgresso = Math.min(100, Math.max(0, Math.round((kmDesdeUltima / totalInterval) * 100)));
      } else {
        // Carreta: sem odômetro, controle de vencimento baseado em Data / Periodicidade
        const proximaData = plan.dataProximaManutencao || '';
        if (proximaData) {
          const targetTime = new Date(proximaData).getTime();
          diasRestantes = Math.round((targetTime - todayTime) / (1000 * 60 * 60 * 24));
          const toleranciaDias = plan.toleranciaAlertaDias ?? 15;

          if (diasRestantes <= 0) {
            status = 'vencido';
          } else if (diasRestantes <= toleranciaDias) {
            status = 'proximo';
          } else {
            status = 'em_dia';
          }
        }
      }

      return {
        ...plan,
        kmAtual,
        kmRestante,
        diasRestantes,
        status,
        percentProgresso,
        modeloVeiculo: veh?.modelo || (isCavalo ? 'Cavalo Mecânico' : 'Carreta'),
        veiculoAtivo: veh ? veh.ativo !== false : true,
      };
    });
  }, [maintenancePlans, vehicleMap, todayStr]);

  // Overall KPI metrics for Preventive Alerts
  const kpiAlerts = useMemo(() => {
    const total = plansWithStatus.length;
    const vencidos = plansWithStatus.filter(p => p.status === 'vencido').length;
    const proximos = plansWithStatus.filter(p => p.status === 'proximo').length;
    const emDia = plansWithStatus.filter(p => p.status === 'em_dia').length;

    const cavalosMonitorados = new Set(plansWithStatus.filter(p => p.tipoVeiculo === 'Cavalo').map(p => p.placa)).size;
    const carretasMonitoradas = new Set(plansWithStatus.filter(p => p.tipoVeiculo === 'Carreta').map(p => p.placa)).size;

    return { total, vencidos, proximos, emDia, cavalosMonitorados, carretasMonitoradas };
  }, [plansWithStatus]);

  // Filtered maintenance plans
  const filteredPlans = useMemo(() => {
    return plansWithStatus.filter(plan => {
      if (vehicleTypeFilter !== 'all' && plan.tipoVeiculo !== vehicleTypeFilter) return false;
      if (statusFilter !== 'all' && plan.status !== statusFilter) return false;
      if (selectedVehicleFilter !== 'all' && plan.placa !== selectedVehicleFilter) return false;

      if (planSearch.trim()) {
        const query = planSearch.toLowerCase();
        const matchesPlaca = plan.placa.toLowerCase().includes(query);
        const matchesItem = plan.itemServico.toLowerCase().includes(query);
        const matchesObs = (plan.observacoes || '').toLowerCase().includes(query);
        const matchesModel = plan.modeloVeiculo.toLowerCase().includes(query);
        if (!matchesPlaca && !matchesItem && !matchesObs && !matchesModel) return false;
      }

      return true;
    }).sort((a, b) => {
      const order = { vencido: 0, proximo: 1, em_dia: 2 };
      if (order[a.status] !== order[b.status]) {
        return order[a.status] - order[b.status];
      }
      return (a.kmRestante || 0) - (b.kmRestante || 0);
    });
  }, [plansWithStatus, vehicleTypeFilter, statusFilter, selectedVehicleFilter, planSearch]);

  // Filtered service history
  const filteredRecords = useMemo(() => {
    return maintenanceRecords.filter(rec => {
      if (!isDateInPeriod(rec.dataServico, historyPeriodFilter)) return false;
      if (historyTypeFilter !== 'all' && rec.tipoManutencao !== historyTypeFilter) return false;
      if (historyVehicleFilter !== 'all' && rec.placa !== historyVehicleFilter) return false;

      if (historySearch.trim()) {
        const query = historySearch.toLowerCase();
        const matchesPlaca = rec.placa.toLowerCase().includes(query);
        const matchesItem = rec.itemServico.toLowerCase().includes(query);
        const matchesDesc = rec.descricao.toLowerCase().includes(query);
        const matchesOficina = rec.oficina.toLowerCase().includes(query);
        const matchesMecanico = (rec.mecanicoResponsavel || '').toLowerCase().includes(query);
        const matchesNF = (rec.numeroNotaFiscal || '').toLowerCase().includes(query);
        if (!matchesPlaca && !matchesItem && !matchesDesc && !matchesOficina && !matchesMecanico && !matchesNF) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => b.dataServico.localeCompare(a.dataServico));
  }, [maintenanceRecords, historyPeriodFilter, historyTypeFilter, historyVehicleFilter, historySearch]);

  // KPI for service history in the selected period
  const kpiHistory = useMemo(() => {
    const totalServicos = filteredRecords.length;
    const custoTotal = filteredRecords.reduce((acc, r) => acc + (r.custoTotal || 0), 0);
    const preventivas = filteredRecords.filter(r => r.tipoManutencao === 'Preventiva' || r.tipoManutencao === 'Revisão Periódica').length;
    const corretivas = filteredRecords.filter(r => r.tipoManutencao === 'Corretiva').length;
    const veiculosAtendidos = new Set(filteredRecords.map(r => r.placa)).size;

    return { totalServicos, custoTotal, preventivas, corretivas, veiculosAtendidos };
  }, [filteredRecords]);

  // Selected vehicle in plan modal helper
  const selectedPlanVehicle = useMemo(() => {
    return vehicleMap.get(planPlaca);
  }, [vehicleMap, planPlaca]);

  const isSelectedVehicleCavalo = selectedPlanVehicle?.tipo === 'Cavalo';

  // Selected vehicle in record modal helper
  const selectedRecordVehicle = useMemo(() => {
    return vehicleMap.get(recPlaca);
  }, [vehicleMap, recPlaca]);

  const isSelectedRecordCavalo = selectedRecordVehicle?.tipo === 'Cavalo';

  // Handlers for Plan Modal
  const handleOpenNewPlan = (prefillPlaca?: string) => {
    setEditingPlanId(null);
    const defaultPlaca = prefillPlaca || (vehicles[0]?.placa || '');
    setPlanPlaca(defaultPlaca);
    setPlanItemServico('');
    setPlanIntervaloKm(20000);
    setPlanIntervaloMeses(6);

    const targetVeh = vehicleMap.get(defaultPlaca);
    if (targetVeh?.tipo === 'Cavalo') {
      setPlanKmUltima(targetVeh.kmAtual || 0);
    } else {
      setPlanKmUltima(0);
    }

    const today = new Date().toISOString().slice(0, 10);
    setPlanDataUltima(today);

    // Calculate default next date for trailer (today + 6 months)
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 6);
    setPlanDataProxima(nextDate.toISOString().slice(0, 10));

    setPlanToleranciaKm(1000);
    setPlanObservacoes('');
    setPlanError(null);
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan: MaintenancePlan) => {
    setEditingPlanId(plan.id);
    setPlanPlaca(plan.placa);
    setPlanItemServico(plan.itemServico);
    setPlanIntervaloKm(plan.intervaloKm || 20000);
    setPlanIntervaloMeses(plan.intervaloMeses || 6);
    setPlanKmUltima(plan.kmUltimaManutencao || 0);
    setPlanDataUltima(plan.dataUltimaManutencao || new Date().toISOString().slice(0, 10));
    setPlanDataProxima(plan.dataProximaManutencao || '');
    setPlanToleranciaKm(plan.toleranciaAlertaKm || 1000);
    setPlanObservacoes(plan.observacoes || '');
    setPlanError(null);
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    setPlanError(null);

    const cleanPlate = formatPlate(planPlaca);
    if (!cleanPlate || cleanPlate.length < 7) {
      setPlanError('Informe uma placa válida.');
      return;
    }

    if (!planItemServico.trim()) {
      setPlanError('Informe o item de serviço preventivo.');
      return;
    }

    const veh = vehicleMap.get(cleanPlate);
    const tipoVeiculo = veh?.tipo || 'Cavalo';

    if (tipoVeiculo === 'Cavalo') {
      if (!planIntervaloKm || planIntervaloKm <= 0) {
        setPlanError('Informe um intervalo de KM válido maior que zero.');
        return;
      }
      const kmProxima = Number(planKmUltima) + Number(planIntervaloKm);

      if (editingPlanId) {
        updateMaintenancePlan(editingPlanId, {
          placa: cleanPlate,
          tipoVeiculo,
          itemServico: planItemServico.trim(),
          intervaloKm: Number(planIntervaloKm),
          kmUltimaManutencao: Number(planKmUltima),
          dataUltimaManutencao: planDataUltima,
          kmProximaManutencao: kmProxima,
          toleranciaAlertaKm: Number(planToleranciaKm) || 1000,
          observacoes: planObservacoes.trim(),
        });
        showFeedback('Plano de manutenção preventiva do cavalo atualizado!');
      } else {
        addMaintenancePlan({
          veiculoId: veh?.id || `veh-${cleanPlate}`,
          placa: cleanPlate,
          tipoVeiculo,
          itemServico: planItemServico.trim(),
          intervaloKm: Number(planIntervaloKm),
          kmUltimaManutencao: Number(planKmUltima),
          dataUltimaManutencao: planDataUltima,
          kmProximaManutencao: kmProxima,
          toleranciaAlertaKm: Number(planToleranciaKm) || 1000,
          ativo: true,
          observacoes: planObservacoes.trim(),
        });
        showFeedback('Novo plano preventivo por KM cadastrado com sucesso!');
      }
    } else {
      // Carreta: controle por data / periodicidade (sem odômetro)
      if (!planIntervaloMeses || planIntervaloMeses <= 0) {
        setPlanError('Informe a periodicidade em meses para a revisão da carreta.');
        return;
      }

      let dataProxima = planDataProxima;
      if (!dataProxima && planDataUltima) {
        const d = new Date(planDataUltima);
        d.setMonth(d.getMonth() + Number(planIntervaloMeses));
        dataProxima = d.toISOString().slice(0, 10);
      }

      if (editingPlanId) {
        updateMaintenancePlan(editingPlanId, {
          placa: cleanPlate,
          tipoVeiculo,
          itemServico: planItemServico.trim(),
          intervaloMeses: Number(planIntervaloMeses),
          dataUltimaManutencao: planDataUltima,
          dataProximaManutencao: dataProxima,
          toleranciaAlertaDias: 15,
          observacoes: planObservacoes.trim(),
        });
        showFeedback('Plano periódico de revisão da carreta atualizado!');
      } else {
        addMaintenancePlan({
          veiculoId: veh?.id || `veh-${cleanPlate}`,
          placa: cleanPlate,
          tipoVeiculo,
          itemServico: planItemServico.trim(),
          intervaloMeses: Number(planIntervaloMeses),
          dataUltimaManutencao: planDataUltima,
          dataProximaManutencao: dataProxima,
          toleranciaAlertaDias: 15,
          ativo: true,
          observacoes: planObservacoes.trim(),
        });
        showFeedback('Novo plano periódico de revisão da carreta cadastrado com sucesso!');
      }
    }

    setIsPlanModalOpen(false);
  };

  // Handlers for Service Record Modal
  const handleOpenNewRecord = (prefillPlaca?: string, prefillItem?: string, prefillKm?: number) => {
    setEditingRecordId(null);
    const targetPlate = prefillPlaca || (vehicles[0]?.placa || '');
    setRecPlaca(targetPlate);
    setRecData(new Date().toISOString().slice(0, 10));

    const targetVeh = vehicleMap.get(targetPlate);
    if (targetVeh?.tipo === 'Cavalo') {
      const currentKm = targetVeh.kmAtual ?? 0;
      setRecKm(prefillKm !== undefined ? prefillKm : currentKm);
    } else {
      // Carreta has no odometer
      setRecKm('');
    }

    setRecTipo('Preventiva');
    setRecItem(prefillItem || '');
    setRecOficina('Oficina Interna Matriz');
    setRecMecanico('');
    setRecDescricao('');
    setRecCusto(0);
    setRecNF('');
    setRecProximaTrocaKm(undefined);
    setRecProximaTrocaData('');
    setRecError(null);
    setIsRecordModalOpen(true);
  };

  const handleOpenEditRecord = (rec: MaintenanceRecord) => {
    setEditingRecordId(rec.id);
    setRecPlaca(rec.placa);
    setRecData(rec.dataServico);
    setRecKm(rec.kmServico !== undefined ? rec.kmServico : '');
    setRecTipo(rec.tipoManutencao);
    setRecItem(rec.itemServico);
    setRecOficina(rec.oficina);
    setRecMecanico(rec.mecanicoResponsavel || '');
    setRecDescricao(rec.descricao);
    setRecCusto(rec.custoTotal);
    setRecNF(rec.numeroNotaFiscal || '');
    setRecProximaTrocaKm(rec.proximaTrocaKmRecomendada);
    setRecProximaTrocaData(rec.proximaTrocaDataRecomendada || '');
    setRecError(null);
    setIsRecordModalOpen(true);
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    setRecError(null);

    const cleanPlate = formatPlate(recPlaca);
    if (!cleanPlate || cleanPlate.length < 7) {
      setRecError('Informe uma placa válida.');
      return;
    }

    if (!recItem.trim()) {
      setRecError('Informe o item ou serviço realizado.');
      return;
    }

    const veh = vehicleMap.get(cleanPlate);
    const tipoVeiculo = veh?.tipo || 'Cavalo';

    // KM is only required for Cavalos
    if (tipoVeiculo === 'Cavalo') {
      if (recKm === '' || Number(recKm) < 0) {
        setRecError('Informe o odômetro (KM) no momento do serviço do cavalo.');
        return;
      }
    }

    if (editingRecordId) {
      updateMaintenanceRecord(editingRecordId, {
        placa: cleanPlate,
        tipoVeiculo,
        dataServico: recData,
        kmServico: tipoVeiculo === 'Cavalo' && recKm !== '' ? Number(recKm) : undefined,
        tipoManutencao: recTipo,
        itemServico: recItem.trim(),
        oficina: recOficina.trim(),
        mecanicoResponsavel: recMecanico.trim(),
        descricao: recDescricao.trim(),
        custoTotal: Number(recCusto) || 0,
        numeroNotaFiscal: recNF.trim(),
        proximaTrocaKmRecomendada: tipoVeiculo === 'Cavalo' && recProximaTrocaKm ? Number(recProximaTrocaKm) : undefined,
        proximaTrocaDataRecomendada: tipoVeiculo === 'Carreta' && recProximaTrocaData ? recProximaTrocaData : undefined,
      });
      showFeedback('Serviço realizado atualizado com sucesso!');
    } else {
      addMaintenanceRecord({
        veiculoId: veh?.id || `veh-${cleanPlate}`,
        placa: cleanPlate,
        tipoVeiculo,
        dataServico: recData,
        kmServico: tipoVeiculo === 'Cavalo' && recKm !== '' ? Number(recKm) : undefined,
        tipoManutencao: recTipo,
        itemServico: recItem.trim(),
        oficina: recOficina.trim() || 'Oficina Interna Matriz',
        mecanicoResponsavel: recMecanico.trim(),
        descricao: recDescricao.trim(),
        custoTotal: Number(recCusto) || 0,
        numeroNotaFiscal: recNF.trim(),
        proximaTrocaKmRecomendada: tipoVeiculo === 'Cavalo' && recProximaTrocaKm ? Number(recProximaTrocaKm) : undefined,
        proximaTrocaDataRecomendada: tipoVeiculo === 'Carreta' && recProximaTrocaData ? recProximaTrocaData : undefined,
      });
      showFeedback(`Serviço registrado com sucesso para a placa ${cleanPlate}!`);
    }

    setIsRecordModalOpen(false);
  };

  // Export CSV
  const handleExportPlansCSV = () => {
    const headers = [
      'Placa',
      'Tipo de Veículo',
      'Modelo',
      'Odômetro Atual (Cavalo)',
      'Item de Serviço',
      'Intervalo Programado',
      'Última Manutenção',
      'Próxima Manutenção',
      'Status do Alerta',
      'Observações'
    ];

    const rows = filteredPlans.map(p => [
      `"${p.placa}"`,
      `"${p.tipoVeiculo}"`,
      `"${p.modeloVeiculo}"`,
      p.tipoVeiculo === 'Cavalo' ? (p.kmAtual || 0) : '-',
      `"${p.itemServico.replace(/"/g, '""')}"`,
      p.tipoVeiculo === 'Cavalo' ? `${p.intervaloKm} km` : `${p.intervaloMeses || 6} meses`,
      p.tipoVeiculo === 'Cavalo' ? `${formatDateBR(p.dataUltimaManutencao)} (${p.kmUltimaManutencao || 0} km)` : formatDateBR(p.dataUltimaManutencao),
      p.tipoVeiculo === 'Cavalo' ? `${p.kmProximaManutencao} km` : formatDateBR(p.dataProximaManutencao || ''),
      `"${p.status === 'vencido' ? 'VENCIDA' : p.status === 'proximo' ? 'ATENÇÃO' : 'EM DIA'}"`,
      `"${(p.observacoes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `planos_manutencao_preventiva_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportHistoryCSV = () => {
    const headers = [
      'Data do Serviço',
      'Placa',
      'Tipo de Veículo',
      'Odômetro (KM - Cavalo)',
      'Tipo de Manutenção',
      'Item do Serviço',
      'Oficina / Local',
      'Mecânico Responsável',
      'Custo Total (R$)',
      'Nota Fiscal / O.S.',
      'Descrição Detalhada'
    ];

    const rows = filteredRecords.map(r => [
      `"${formatDateBR(r.dataServico)}"`,
      `"${r.placa}"`,
      `"${r.tipoVeiculo}"`,
      r.tipoVeiculo === 'Cavalo' ? (r.kmServico || '') : 'Sem odômetro',
      `"${r.tipoManutencao}"`,
      `"${r.itemServico.replace(/"/g, '""')}"`,
      `"${r.oficina.replace(/"/g, '""')}"`,
      `"${(r.mecanicoResponsavel || '').replace(/"/g, '""')}"`,
      r.custoTotal.toFixed(2),
      `"${(r.numeroNotaFiscal || '').replace(/"/g, '""')}"`,
      `"${r.descricao.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `historico_manutencao_${historyPeriodFilter.mode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
      {feedbackMsg && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-sm transition-all border ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200' 
            : 'bg-red-950/80 border-red-800 text-red-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Screen Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            <Wrench className="w-4 h-4" />
            <span>Gestão da Frota · Manutenção Preventiva</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Manutenção Preventiva de Cavalos e Carretas
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Controle preventivo por KM para cavalos mecânicos e revisões periódicas para carretas semirreboques.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleOpenNewRecord()}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Lançar Serviço Realizado</span>
          </button>

          <button
            onClick={() => handleOpenNewPlan()}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Plano Preventivo</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs: only 2 tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'alerts'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <AlertTriangle className={`w-4 h-4 ${kpiAlerts.vencidos > 0 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
          <span>Planos & Alertas Preventivos</span>
          {kpiAlerts.vencidos > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-600/30 text-red-300 border border-red-500/40">
              {kpiAlerts.vencidos} vencida{kpiAlerts.vencidos > 1 ? 's' : ''}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <History className="w-4 h-4 text-blue-400" />
          <span>Histórico de Serviços Realizados</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {maintenanceRecords.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PLANOS & ALERTAS PREVENTIVOS */}
      {/* ========================================================================= */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Vencidas (Crítico) */}
            <div className={`p-4 rounded-xl border transition-all ${
              kpiAlerts.vencidos > 0 
                ? 'bg-red-950/40 border-red-800/80' 
                : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Manutenções Vencidas
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  kpiAlerts.vencidos > 0 ? 'bg-red-600/20 text-red-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-2xl font-bold font-mono ${
                  kpiAlerts.vencidos > 0 ? 'text-red-400' : 'text-slate-200'
                }`}>
                  {kpiAlerts.vencidos}
                </span>
                <span className="text-[11px] text-slate-400">
                  {kpiAlerts.vencidos === 1 ? 'item vencido' : 'itens vencidos'}
                </span>
              </div>
              <p className="text-[11px] text-red-300/80 mt-1">
                {kpiAlerts.vencidos > 0 ? 'Ação imediata recomendada para evitar paradas' : 'Nenhuma manutenção vencida na frota'}
              </p>
            </div>

            {/* 2. Próximas de Vencer (Atenção) */}
            <div className={`p-4 rounded-xl border transition-all ${
              kpiAlerts.proximos > 0 
                ? 'bg-amber-950/40 border-amber-800/80' 
                : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Atenção / Próximas
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  kpiAlerts.proximos > 0 ? 'bg-amber-600/20 text-amber-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-2xl font-bold font-mono ${
                  kpiAlerts.proximos > 0 ? 'text-amber-400' : 'text-slate-200'
                }`}>
                  {kpiAlerts.proximos}
                </span>
                <span className="text-[11px] text-slate-400">
                  próximas do vencimento
                </span>
              </div>
              <p className="text-[11px] text-amber-300/80 mt-1">
                Programar revisão na próxima escala ou descarga
              </p>
            </div>

            {/* 3. Em Dia */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Planos em Dia
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {kpiAlerts.emDia}
                </span>
                <span className="text-[11px] text-slate-400">
                  dentro do prazo regular
                </span>
              </div>
              <p className="text-[11px] text-emerald-400/80 mt-1">
                Cronograma preventivo regular
              </p>
            </div>

            {/* 4. Frota Monitorada */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Frota Monitorada
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-blue-400">
                  {kpiAlerts.cavalosMonitorados + kpiAlerts.carretasMonitoradas}
                </span>
                <span className="text-[11px] text-slate-400">
                  veículos ({kpiAlerts.total} planos)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {kpiAlerts.cavalosMonitorados} Cavalos (KM) · {kpiAlerts.carretasMonitoradas} Carretas (Periódico)
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
                  value={planSearch}
                  onChange={(e) => setPlanSearch(e.target.value)}
                  placeholder="Buscar por placa, serviço ou modelo..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Vehicle Type Filter */}
              <select
                value={vehicleTypeFilter}
                onChange={(e) => setVehicleTypeFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="all">Tipo: Cavalos e Carretas</option>
                <option value="Cavalo">Apenas Cavalos (KM)</option>
                <option value="Carreta">Apenas Carretas (Periódicas)</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="all">Status: Todos</option>
                <option value="vencido">🔴 Vencidas ({kpiAlerts.vencidos})</option>
                <option value="proximo">🟡 Atenção / Próximas ({kpiAlerts.proximos})</option>
                <option value="em_dia">🟢 Em Dia ({kpiAlerts.emDia})</option>
              </select>

              {/* Vehicle Plate Filter */}
              <select
                value={selectedVehicleFilter}
                onChange={(e) => setSelectedVehicleFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="all">Veículo: Todos</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.placa}>
                    {v.placa} ({v.tipo})
                  </option>
                ))}
              </select>
            </div>

            {/* Export CSV button */}
            <button
              onClick={handleExportPlansCSV}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Alertas (CSV)</span>
            </button>
          </div>

          {/* Plans Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Cronograma de Manutenção Preventiva da Frota</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Exibindo {filteredPlans.length} {filteredPlans.length === 1 ? 'plano preventivo' : 'planos preventivos'} (KM para cavalos e datas periódicas para carretas)
                </p>
              </div>
            </div>

            {filteredPlans.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Wrench className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-medium text-slate-400">Nenhum plano de manutenção encontrado</p>
                <p className="text-xs text-slate-500 mt-1">Ajuste os filtros ou cadastre um novo plano preventivo.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Veículo / Placa</th>
                      <th className="py-3 px-4">Item de Manutenção</th>
                      <th className="py-3 px-4">Odômetro (Cavalo)</th>
                      <th className="py-3 px-4">Próxima Manutenção</th>
                      <th className="py-3 px-4 min-w-[140px]">Ciclo / Intervalo</th>
                      <th className="py-3 px-4">Status / Alerta</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredPlans.map(plan => {
                      const isVencido = plan.status === 'vencido';
                      const isProximo = plan.status === 'proximo';
                      const isCavalo = plan.tipoVeiculo === 'Cavalo';

                      return (
                        <tr 
                          key={plan.id}
                          className={`hover:bg-slate-800/50 transition-colors ${
                            isVencido ? 'bg-red-950/20' : isProximo ? 'bg-amber-950/15' : ''
                          }`}
                        >
                          {/* Placa & Veículo */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white bg-slate-950 px-2 py-1 rounded border border-slate-700 text-xs">
                                {plan.placa}
                              </span>
                              <div className="flex flex-col">
                                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded w-fit ${
                                  isCavalo 
                                    ? 'bg-blue-900/40 text-blue-300 border border-blue-800/50' 
                                    : 'bg-purple-900/40 text-purple-300 border border-purple-800/50'
                                }`}>
                                  {plan.tipoVeiculo}
                                </span>
                                <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                                  {plan.modeloVeiculo}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Item de Manutenção */}
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-200">
                              {plan.itemServico}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              {isCavalo ? (
                                <>
                                  <span>Intervalo: {formatKM(plan.intervaloKm)}</span>
                                  <span>·</span>
                                  <span>Última: {formatDateBR(plan.dataUltimaManutencao)} ({formatKM(plan.kmUltimaManutencao)})</span>
                                </>
                              ) : (
                                <>
                                  <span>Periodicidade: {plan.intervaloMeses || 6} meses</span>
                                  <span>·</span>
                                  <span>Última revisão: {formatDateBR(plan.dataUltimaManutencao)}</span>
                                </>
                              )}
                            </div>
                            {plan.observacoes && (
                              <div className="text-[10px] text-slate-400 italic mt-0.5 truncate max-w-[280px]">
                                {plan.observacoes}
                              </div>
                            )}
                          </td>

                          {/* Odômetro Atual (Apenas Cavalo) */}
                          <td className="py-3.5 px-4 font-mono">
                            {isCavalo ? (
                              <span className="font-semibold text-slate-300">
                                {formatKM(plan.kmAtual)}
                              </span>
                            ) : (
                              <span className="text-slate-600 font-sans text-xs">
                                —
                              </span>
                            )}
                          </td>

                          {/* Próxima Troca / Revisão */}
                          <td className="py-3.5 px-4">
                            {isCavalo ? (
                              <span className="font-mono font-semibold text-slate-200">
                                {formatKM(plan.kmProximaManutencao)}
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                                <span>{formatDateBR(plan.dataProximaManutencao || '')}</span>
                              </div>
                            )}
                          </td>

                          {/* Ciclo / Intervalo */}
                          <td className="py-3.5 px-4">
                            {isCavalo ? (
                              <div>
                                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                                  <div 
                                    className={`h-full transition-all ${
                                      isVencido ? 'bg-red-500' : isProximo ? 'bg-amber-400' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${plan.percentProgresso}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                  <span>{plan.percentProgresso}% do ciclo</span>
                                  {plan.kmRestante >= 0 ? (
                                    <span className={isProximo ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                                      faltam {formatKM(plan.kmRestante)}
                                    </span>
                                  ) : (
                                    <span className="text-red-400 font-bold">
                                      +{formatKM(Math.abs(plan.kmRestante))} excedidos
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-300">
                                <span className="font-medium text-slate-200">Revisão Periódica</span>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {plan.diasRestantes >= 0 ? (
                                    <span className={isProximo ? 'text-amber-400 font-medium' : 'text-slate-400'}>
                                      faltam {plan.diasRestantes} dias
                                    </span>
                                  ) : (
                                    <span className="text-red-400 font-bold">
                                      vencida há {Math.abs(plan.diasRestantes)} dias
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Status / Alerta Badge */}
                          <td className="py-3.5 px-4">
                            {isCavalo ? (
                              isVencido ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-950/80 text-red-300 border border-red-700/80 shadow-sm animate-pulse">
                                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                  <span>VENCIDA (+{formatKM(Math.abs(plan.kmRestante))})</span>
                                </span>
                              ) : isProximo ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/80">
                                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span>ATENÇÃO (faltam {formatKM(plan.kmRestante)})</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <span>EM DIA ({formatKM(plan.kmRestante)})</span>
                                </span>
                              )
                            ) : (
                              isVencido ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-950/80 text-red-300 border border-red-700/80 shadow-sm animate-pulse">
                                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                  <span>VENCIDA ({Math.abs(plan.diasRestantes)}d)</span>
                                </span>
                              ) : isProximo ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/80">
                                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span>ATENÇÃO ({plan.diasRestantes}d)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <span>EM DIA</span>
                                </span>
                              )
                            )}
                          </td>

                          {/* Ações */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Direct action: Registrar Serviço Realizado */}
                              <button
                                onClick={() => handleOpenNewRecord(plan.placa, plan.itemServico, isCavalo ? plan.kmAtual : undefined)}
                                title="Registrar serviço realizado para este plano"
                                className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-700/80 hover:bg-emerald-600 text-white rounded transition-colors flex items-center gap-1"
                              >
                                <Wrench className="w-3 h-3" />
                                <span>Dar Baixa</span>
                              </button>

                              {/* Editar Plano */}
                              <button
                                onClick={() => handleOpenEditPlan(plan)}
                                title="Editar Plano"
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Excluir Plano */}
                              <button
                                onClick={() => setDeleteModalState({
                                  isOpen: true,
                                  type: 'plan',
                                  id: plan.id,
                                  title: 'Excluir Plano Preventivo',
                                  message: `Tem certeza que deseja remover o plano de "${plan.itemServico}" para a placa ${plan.placa}?`,
                                })}
                                title="Excluir Plano"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HISTÓRICO DE SERVIÇOS REALIZADOS */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Period Filter Component */}
          <PeriodFilter
            filter={historyPeriodFilter}
            onChange={setHistoryPeriodFilter}
            matchingCount={filteredRecords.length}
            title="Filtro de Período para Histórico de Manutenção"
          />

          {/* KPI Summary for Service History */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total de Serviços
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">
                  {kpiHistory.totalServicos}
                </span>
                <span className="text-xs text-slate-400">execuções no período</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {kpiHistory.veiculosAtendidos} veículos atendidos na oficina
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Investimento Total em Manutenção
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {formatCurrencyBR(kpiHistory.custoTotal)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Peças, mão de obra e serviços especializados
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Manutenções Preventivas
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-blue-400">
                  {kpiHistory.preventivas}
                </span>
                <span className="text-xs text-slate-400">serviços preventivos</span>
              </div>
              <p className="text-[11px] text-blue-400/80 mt-1">
                Prevenção de quebras e manutenção programada
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Manutenções Corretivas
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-amber-400">
                  {kpiHistory.corretivas}
                </span>
                <span className="text-xs text-slate-400">reparos emergenciais</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Intervenções por falhas ou desgaste não programado
              </p>
            </div>
          </div>

          {/* History Search & Filters */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Buscar por oficina, mecânico, descrição, NF..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Maintenance Type Filter */}
              <select
                value={historyTypeFilter}
                onChange={(e) => setHistoryTypeFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="all">Tipo: Todos os Serviços</option>
                <option value="Preventiva">Preventiva</option>
                <option value="Corretiva">Corretiva</option>
                <option value="Revisão Periódica">Revisão Periódica</option>
                <option value="Troca de Peças">Troca de Peças</option>
              </select>

              {/* Plate Filter */}
              <select
                value={historyVehicleFilter}
                onChange={(e) => setHistoryVehicleFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="all">Veículo: Todos</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.placa}>
                    {v.placa} ({v.tipo})
                  </option>
                ))}
              </select>
            </div>

            {/* Export CSV button */}
            <button
              onClick={handleExportHistoryCSV}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Histórico (CSV)</span>
            </button>
          </div>

          {/* History Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-400" />
                  <span>Histórico Detalhado de Manutenções</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {getPeriodLabel(historyPeriodFilter)} · {filteredRecords.length} lançamentos encontrados
                </p>
              </div>
            </div>

            {filteredRecords.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-medium text-slate-400">Nenhum serviço registrado neste período</p>
                <p className="text-xs text-slate-500 mt-1">Alterne o filtro de período ou clique em "Lançar Serviço Realizado".</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Placa / Veículo</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">Serviço / Peças</th>
                      <th className="py-3 px-4">Odômetro (Cavalo)</th>
                      <th className="py-3 px-4">Oficina & Responsável</th>
                      <th className="py-3 px-4 text-right">Custo Total</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredRecords.map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-800/50 transition-colors">
                        {/* Data */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-300">
                          {formatDateBR(rec.dataServico)}
                        </td>

                        {/* Placa & Veículo */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
                              {rec.placa}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                              rec.tipoVeiculo === 'Cavalo' 
                                ? 'bg-blue-900/40 text-blue-300 border border-blue-800/40' 
                                : 'bg-purple-900/40 text-purple-300 border border-purple-800/40'
                            }`}>
                              {rec.tipoVeiculo}
                            </span>
                          </div>
                        </td>

                        {/* Tipo de Manutenção */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            rec.tipoManutencao === 'Preventiva'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : rec.tipoManutencao === 'Corretiva'
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-blue-950 text-blue-300 border-blue-800'
                          }`}>
                            {rec.tipoManutencao}
                          </span>
                        </td>

                        {/* Serviço & Descrição */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-100">
                            {rec.itemServico}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 max-w-[320px]">
                            {rec.descricao}
                          </div>
                          {rec.proximaTrocaKmRecomendada && (
                            <div className="text-[10px] text-blue-400 mt-0.5">
                              Próxima troca recomendada: {formatKM(rec.proximaTrocaKmRecomendada)}
                            </div>
                          )}
                          {rec.proximaTrocaDataRecomendada && (
                            <div className="text-[10px] text-purple-400 mt-0.5">
                              Próxima revisão recomendada: {formatDateBR(rec.proximaTrocaDataRecomendada)}
                            </div>
                          )}
                        </td>

                        {/* Odômetro na Execução (Apenas para Cavalo) */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                          {rec.tipoVeiculo === 'Cavalo' ? (
                            <span className="font-semibold text-slate-300">
                              {formatKM(rec.kmServico)}
                            </span>
                          ) : (
                            <span className="text-slate-600 font-sans text-xs">
                              —
                            </span>
                          )}
                        </td>

                        {/* Oficina e Mecânico */}
                        <td className="py-3.5 px-4">
                          <div className="text-slate-200 font-medium truncate max-w-[160px]">
                            {rec.oficina}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {rec.mecanicoResponsavel ? `Mecânico: ${rec.mecanicoResponsavel}` : ''}
                            {rec.numeroNotaFiscal ? ` · NF: ${rec.numeroNotaFiscal}` : ''}
                          </div>
                        </td>

                        {/* Custo Total */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right font-mono font-bold text-emerald-400">
                          {formatCurrencyBR(rec.custoTotal)}
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditRecord(rec)}
                              title="Editar Serviço"
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteModalState({
                                isOpen: true,
                                type: 'record',
                                id: rec.id,
                                title: 'Excluir Histórico de Serviço',
                                message: `Deseja realmente remover o registro de serviço "${rec.itemServico}" da placa ${rec.placa}?`,
                              })}
                              title="Excluir Serviço"
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVO / EDITAR PLANO DE MANUTENÇÃO PREVENTIVA */}
      {/* ========================================================================= */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsPlanModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingPlanId ? 'Editar Plano Preventivo' : 'Novo Plano de Manutenção Preventiva'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isSelectedVehicleCavalo ? 'Controle por KM para Cavalo Mecânico' : 'Controle periódico por data para Carreta'}
                </p>
              </div>
            </div>

            {planError && (
              <div className="p-3 mb-4 rounded-lg bg-red-950/80 border border-red-800 text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{planError}</span>
              </div>
            )}

            <form onSubmit={handleSavePlan} className="space-y-4">
              {/* Veículo (Placa) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Veículo da Frota (Cavalo ou Carreta) *
                </label>
                <select
                  value={planPlaca}
                  onChange={(e) => {
                    const selected = e.target.value;
                    setPlanPlaca(selected);
                    const veh = vehicleMap.get(selected);
                    if (veh && !editingPlanId) {
                      if (veh.tipo === 'Cavalo') {
                        setPlanKmUltima(veh.kmAtual || 0);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Selecione um veículo...</option>
                  <optgroup label="Cavalos Mecânicos (Controle por Odômetro/KM)">
                    {vehicles.filter(v => v.tipo === 'Cavalo').map(v => (
                      <option key={v.id} value={v.placa}>
                        {v.placa} - {v.modelo || 'Cavalo'} ({formatKM(v.kmAtual)})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Carretas e Semirreboques (Controle Periódico por Data)">
                    {vehicles.filter(v => v.tipo === 'Carreta').map(v => (
                      <option key={v.id} value={v.placa}>
                        {v.placa} - {v.modelo || 'Carreta'}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Notice for Carretas */}
              {!isSelectedVehicleCavalo && selectedPlanVehicle && (
                <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-800/60 text-xs text-purple-200 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>
                    <strong>Carreta Semirreboque:</strong> Não possui odômetro. O controle preventivo é realizado por periodicidade de tempo / meses e data de revisão.
                  </span>
                </div>
              )}

              {/* Item de Manutenção */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Item / Serviço Preventivo *
                </label>
                <input
                  type="text"
                  list="preventive-items-list"
                  value={planItemServico}
                  onChange={(e) => setPlanItemServico(e.target.value)}
                  placeholder={isSelectedVehicleCavalo ? "Ex: Troca de Óleo e Filtros do Motor" : "Ex: Revisão de Cuícas e Tambores de Freio"}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                />
                <datalist id="preventive-items-list">
                  {(isSelectedVehicleCavalo ? COMMON_HORSE_ITEMS : COMMON_TRAILER_ITEMS).map((item, idx) => (
                    <option key={idx} value={item} />
                  ))}
                </datalist>
              </div>

              {/* Campos específicos para CAVALO: KM */}
              {isSelectedVehicleCavalo ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Intervalo Programado (KM) *
                      </label>
                      <input
                        type="number"
                        min="500"
                        step="500"
                        value={planIntervaloKm}
                        onChange={(e) => setPlanIntervaloKm(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Tolerância de Alerta (KM)
                      </label>
                      <input
                        type="number"
                        min="100"
                        step="100"
                        value={planToleranciaKm}
                        onChange={(e) => setPlanToleranciaKm(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        KM da Última Troca
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={planKmUltima}
                        onChange={(e) => setPlanKmUltima(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Data da Última Manutenção
                      </label>
                      <input
                        type="date"
                        value={planDataUltima}
                        onChange={(e) => setPlanDataUltima(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Próxima Troca Calculada:</span>
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      {formatKM(Number(planKmUltima) + Number(planIntervaloKm))}
                    </span>
                  </div>
                </>
              ) : (
                /* Campos específicos para CARRETA: Periodicidade por Meses / Data */
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Periodicidade da Revisão (Meses) *
                      </label>
                      <select
                        value={planIntervaloMeses}
                        onChange={(e) => {
                          const m = Number(e.target.value);
                          setPlanIntervaloMeses(m);
                          if (planDataUltima) {
                            const d = new Date(planDataUltima);
                            d.setMonth(d.getMonth() + m);
                            setPlanDataProxima(d.toISOString().slice(0, 10));
                          }
                        }}
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        required
                      >
                        <option value="1">Mensal (1 mês)</option>
                        <option value="2">Bimestral (2 meses)</option>
                        <option value="3">Trimestral (3 meses)</option>
                        <option value="4">Quadrimestral (4 meses)</option>
                        <option value="6">Semestral (6 meses)</option>
                        <option value="12">Anual (12 meses)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Data da Última Manutenção *
                      </label>
                      <input
                        type="date"
                        value={planDataUltima}
                        onChange={(e) => {
                          const dStr = e.target.value;
                          setPlanDataUltima(dStr);
                          if (dStr) {
                            const d = new Date(dStr);
                            d.setMonth(d.getMonth() + planIntervaloMeses);
                            setPlanDataProxima(d.toISOString().slice(0, 10));
                          }
                        }}
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Data Prevista para Próxima Revisão *
                    </label>
                    <input
                      type="date"
                      value={planDataProxima}
                      onChange={(e) => setPlanDataProxima(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </>
              )}

              {/* Observações */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Observações Técnicas / Peças Recomendadas
                </label>
                <textarea
                  rows={2}
                  value={planObservacoes}
                  onChange={(e) => setPlanObservacoes(e.target.value)}
                  placeholder="Instruções adicionais ou especificações técnicas..."
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-sm"
                >
                  {editingPlanId ? 'Salvar Alterações' : 'Cadastrar Plano'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LANÇAR / EDITAR SERVIÇO REALIZADO (HISTÓRICO) */}
      {/* ========================================================================= */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsRecordModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingRecordId ? 'Editar Serviço Realizado' : 'Lançar Novo Serviço Realizado'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isSelectedRecordCavalo ? 'Atualiza o histórico e recalcula o próximo vencimento de KM' : 'Atualiza o histórico e a data da próxima revisão da carreta'}
                </p>
              </div>
            </div>

            {recError && (
              <div className="p-3 mb-4 rounded-lg bg-red-950/80 border border-red-800 text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{recError}</span>
              </div>
            )}

            <form onSubmit={handleSaveRecord} className="space-y-4">
              {/* Placa & Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Veículo / Placa *
                  </label>
                  <select
                    value={recPlaca}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setRecPlaca(selected);
                      const veh = vehicleMap.get(selected);
                      if (veh && !editingRecordId) {
                        if (veh.tipo === 'Cavalo') {
                          setRecKm(veh.kmAtual || 0);
                        } else {
                          setRecKm('');
                        }
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="">Selecione o veículo...</option>
                    <optgroup label="Cavalos Mecânicos">
                      {vehicles.filter(v => v.tipo === 'Cavalo').map(v => (
                        <option key={v.id} value={v.placa}>
                          {v.placa} ({v.modelo || 'Cavalo'}) - KM: {formatKM(v.kmAtual)}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Carretas e Semirreboques">
                      {vehicles.filter(v => v.tipo === 'Carreta').map(v => (
                        <option key={v.id} value={v.placa}>
                          {v.placa} ({v.modelo || 'Carreta'})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Data do Serviço *
                  </label>
                  <input
                    type="date"
                    value={recData}
                    onChange={(e) => setRecData(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Odômetro na Execução (apenas para Cavalo) & Tipo de Manutenção */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {isSelectedRecordCavalo ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Odômetro (KM) no Momento do Serviço *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={recKm}
                      onChange={(e) => setRecKm(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 font-mono"
                      required
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Atualiza o odômetro do cavalo se for maior
                    </span>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Odômetro (Carreta)
                    </label>
                    <div className="px-3 py-2 text-xs bg-slate-950/60 border border-slate-800 rounded-lg text-slate-500 italic">
                      Não se aplica (Carretas não possuem odômetro)
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tipo de Manutenção *
                  </label>
                  <select
                    value={recTipo}
                    onChange={(e) => setRecTipo(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="Preventiva">Preventiva (Programada)</option>
                    <option value="Corretiva">Corretiva (Reparo / Quebra)</option>
                    <option value="Revisão Periódica">Revisão Periódica</option>
                    <option value="Troca de Peças">Troca de Peças / Desgaste</option>
                    <option value="Inspeção">Inspeção Visual / Laudo</option>
                  </select>
                </div>
              </div>

              {/* Item / Serviço Realizado */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Item de Serviço *
                </label>
                <input
                  type="text"
                  list="preventive-items-list-rec"
                  value={recItem}
                  onChange={(e) => setRecItem(e.target.value)}
                  placeholder="Ex: Troca de Óleo e Filtros ou Revisão de Cuícas"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  required
                />
                <datalist id="preventive-items-list-rec">
                  {(isSelectedRecordCavalo ? COMMON_HORSE_ITEMS : COMMON_TRAILER_ITEMS).map((item, idx) => (
                    <option key={idx} value={item} />
                  ))}
                </datalist>
              </div>

              {/* Oficina e Mecânico */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Oficina / Local da Execução *
                  </label>
                  <input
                    type="text"
                    value={recOficina}
                    onChange={(e) => setRecOficina(e.target.value)}
                    placeholder="Ex: Oficina Interna Matriz ou Concessionária"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Mecânico / Técnico Responsável
                  </label>
                  <input
                    type="text"
                    value={recMecanico}
                    onChange={(e) => setRecMecanico(e.target.value)}
                    placeholder="Ex: Edson Martins"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Custo Total e Nota Fiscal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Custo Total (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={recCusto}
                      onChange={(e) => setRecCusto(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Número da Nota Fiscal / O.S.
                  </label>
                  <input
                    type="text"
                    value={recNF}
                    onChange={(e) => setRecNF(e.target.value)}
                    placeholder="Ex: NF-104921 ou OS-8821"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Descrição Detalhada */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Descrição do Serviço e Peças Trocadas *
                </label>
                <textarea
                  rows={3}
                  value={recDescricao}
                  onChange={(e) => setRecDescricao(e.target.value)}
                  placeholder="Descreva peças substituídas, marcas, especificações técnicas..."
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Próxima Recomendação: KM para Cavalo, Data para Carreta */}
              {isSelectedRecordCavalo ? (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Próxima Troca KM Recomendada (Opcional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={recProximaTrocaKm || ''}
                    onChange={(e) => setRecProximaTrocaKm(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Deixe em branco para usar o intervalo padrão"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Data Prevista para Próxima Revisão da Carreta (Opcional)
                  </label>
                  <input
                    type="date"
                    value={recProximaTrocaData}
                    onChange={(e) => setRecProximaTrocaData(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm"
                >
                  {editingRecordId ? 'Salvar Alterações' : 'Confirmar e Salvar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      <ConfirmDeleteModal
        isOpen={deleteModalState.isOpen}
        title={deleteModalState.title}
        message={deleteModalState.message}
        onConfirm={() => {
          if (deleteModalState.type === 'plan') {
            deleteMaintenancePlan(deleteModalState.id);
            showFeedback('Plano de manutenção excluído.');
          } else {
            deleteMaintenanceRecord(deleteModalState.id);
            showFeedback('Registro de serviço excluído.');
          }
          setDeleteModalState(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setDeleteModalState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
