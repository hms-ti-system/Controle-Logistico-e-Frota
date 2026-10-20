import React, { useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { Truck, ShieldCheck, KeyRound, User as UserIcon, ArrowRight, AlertCircle, Sun, Moon } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, quickLoginAs, theme, toggleTheme } = useLogistics();
  const [loginInput, setLoginInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginInput.trim()) {
      setErrorMsg('Informe seu login, e-mail ou CPF.');
      return;
    }
    if (!senhaInput.trim()) {
      setErrorMsg('Informe sua senha.');
      return;
    }

    const res = login(loginInput, senhaInput);
    if (!res.success) {
      setErrorMsg(res.message || 'Falha ao autenticar.');
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 text-slate-100">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          type="button"
          title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer shadow-sm"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Tema Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-sky-500" />
              <span>Tema Escuro</span>
            </>
          )}
        </button>
      </div>
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-4">
            <Truck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Controle Logístico</h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestão integrada de viagens, frotas, motoristas e containers
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-100">Acesso ao Sistema</h2>
            <p className="text-xs text-slate-400 mt-0.5">Entre com seu e-mail, CPF ou usuário</p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/60 border border-red-800/60 flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Login / E-mail / CPF
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="Ex: gestor@logistica.com.br"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Senha
                </label>
                <span className="text-xs text-slate-500">Padrão demo: 123</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={senhaInput}
                  onChange={(e) => setSenhaInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
            >
              <span>Entrar no Sistema</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-xs text-slate-400 mb-3 font-medium">Acesso Rápido de Demonstração:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickLoginAs('gestor')}
                className="flex items-center justify-center gap-1.5 p-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Gestor da Frota</span>
              </button>
              <button
                type="button"
                onClick={() => quickLoginAs('motorista')}
                className="flex items-center justify-center gap-1.5 p-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
              >
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Motorista</span>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-slate-500">
          Controle Operacional de Transporte Rodoviário de Containers
        </div>
      </div>
    </div>
  );
};
