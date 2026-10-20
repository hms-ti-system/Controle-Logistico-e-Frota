export type UserRole = 'motorista' | 'gestor';

export interface User {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  role: UserRole;
  senha?: string;
  ativo?: boolean; // true = ativo na frota, false = inativo
  createdAt: string;
}

export type VehicleType = 'Cavalo' | 'Carreta';

export interface Vehicle {
  id: string;
  placa: string;
  tipo: VehicleType;
  modelo?: string;
  kmAtual?: number; // Apenas para Cavalos (Carretas não possuem odômetro)
  ativo?: boolean; // true = ativo na frota, false = inativo
  createdAt: string;
}

export type ThemeMode = 'dark' | 'light';

export interface Route {
  id: string;
  nome: string;
  origem: string; // cidade, estado
  destino: string; // cidade, estado
  valorFrete?: number; // Valor do frete em R$
  createdAt: string;
}

export type ContainerLoadType = '1_container' | '2_containers';

export interface Trip {
  id: string;
  data: string; // YYYY-MM-DD
  motoristaId: string;
  motoristaNome: string;
  placaCavalo: string;
  placaCarreta: string;
  origem: string;
  destino: string;
  container: string; // Primeiro container (ou container único de 40'/20')
  container2?: string; // Segundo container na mesma carreta (carregamento duplo 2x 20')
  tipoCarregamento?: ContainerLoadType; // '1_container' | '2_containers'
  createdAt: string;
}

export type MaintenanceStatus = 'vencido' | 'proximo' | 'em_dia';
export type MaintenanceType = 'Preventiva' | 'Corretiva' | 'Revisão Periódica' | 'Troca de Peças' | 'Inspeção';

export interface MaintenancePlan {
  id: string;
  veiculoId: string;
  placa: string;
  tipoVeiculo: VehicleType;
  itemServico: string; // e.g. "Troca de Óleo e Filtros", "Lonas de Freio", etc.
  
  // Para Cavalos: controle por odômetro/KM
  intervaloKm?: number; // e.g. 20000
  kmUltimaManutencao?: number; // e.g. 170000
  kmProximaManutencao?: number; // e.g. 190000
  toleranciaAlertaKm?: number; // default 1000 km

  // Para Carretas: controle por periodicidade / data (carretas não possuem odômetro)
  intervaloMeses?: number; // e.g. 3, 6, 12 meses
  dataUltimaManutencao: string; // YYYY-MM-DD
  dataProximaManutencao?: string; // YYYY-MM-DD
  toleranciaAlertaDias?: number; // default 15 dias

  ativo: boolean;
  observacoes?: string;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  veiculoId: string;
  placa: string;
  tipoVeiculo: VehicleType;
  dataServico: string; // YYYY-MM-DD
  kmServico?: number; // Apenas para Cavalos (Carretas não possuem odômetro)
  tipoManutencao: MaintenanceType;
  itemServico: string;
  oficina: string;
  mecanicoResponsavel?: string;
  descricao: string;
  custoTotal: number;
  numeroNotaFiscal?: string;
  proximaTrocaKmRecomendada?: number;
  proximaTrocaDataRecomendada?: string;
  createdAt: string;
}

export interface FuelRecord {
  id: string;
  motoristaId: string;
  motoristaNome: string;
  data: string; // YYYY-MM-DD
  placa: string; // Placa do Cavalo
  km: number; // KM no momento do abastecimento
  localAbastecimento: string; // Local / Posto
  quantidadeLitros: number; // Litros
  valorPorLitro: number; // R$/L
  totalAbastecido: number; // R$ Total
  tipoCombustivel?: string; // Diesel S10, Diesel S500, Arla 32
  consumoMedio?: number; // KM/L calculado em relação ao abastecimento anterior
  kmRodados?: number; // KM percorrido entre abastecimentos
  numeroNotaFiscal?: string;
  observacoes?: string;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
}
