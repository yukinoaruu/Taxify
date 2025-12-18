import React, { useEffect, useState } from 'react';
import { UserProfile, Income, FopGroup } from '../types';
import { FOP_LIMITS, MONTHLY_ESV, TAX_FIXED_G1, TAX_FIXED_G2, MILITARY_LEVY_FIXED, MILITARY_LEVY_RATE_G3 } from '../constants';
import { generateTaxAdvice } from '../services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { TrendingUp, AlertTriangle, MessageSquare, Plus } from 'lucide-react';
import { IncomeModal } from '../components/IncomeModal';
import { dbService } from '../services/dbService';

interface DashboardProps {
  profile: UserProfile;
}

export const Dashboard: React.FC<DashboardProps> = ({ profile }) => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [taxAdvice, setTaxAdvice] = useState<string>("Завантаження аналітики...");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const loadedIncomes = dbService.getIncomes();
    setIncomes(loadedIncomes);
    updateAdvice(loadedIncomes);
  };

  const updateAdvice = async (data: Income[]) => {
    setIsLoadingAdvice(true);
    const total = data.reduce((sum, i) => sum + i.amount, 0); 
    const advice = await generateTaxAdvice(profile, total);
    setTaxAdvice(advice);
    setIsLoadingAdvice(false);
  };

  const handleSaveIncome = (income: Income) => {
    dbService.addIncome(income);
    loadData();
  };

  // --- Calculations 2026 ---
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const limit = FOP_LIMITS[profile.group];
  const limitUsed = totalIncome;
  const limitRemaining = limit - totalIncome;
  const limitPercent = Math.min((limitUsed / limit) * 100, 100);
  
  // Tax Calculation Logic
  let estimatedTaxDisplay = 0;
  let taxLabel = "Податок";
  let esvTotal = MONTHLY_ESV;

  if (profile.group === FopGroup.GROUP_3) {
    // Group 3: % from Income + 1% Military Levy
    const singleTax = totalIncome * profile.taxRate;
    const militaryLevy = totalIncome * MILITARY_LEVY_RATE_G3;
    estimatedTaxDisplay = singleTax + militaryLevy;
    taxLabel = "Податок (ЄП + 1% ВЗ)";
  } else {
    // Group 1 & 2: Fixed Monthly Payment
    // We display the monthly obligation
    const fixedTax = profile.group === FopGroup.GROUP_1 ? TAX_FIXED_G1 : TAX_FIXED_G2;
    estimatedTaxDisplay = fixedTax + MILITARY_LEVY_FIXED;
    taxLabel = "Щомісячний платіж (ЄП + ВЗ)";
  }

  // Chart Data
  const limitData = [
    { name: 'Використано', value: limitUsed, color: '#2563eb' },
    { name: 'Залишилось', value: limitRemaining, color: '#e2e8f0' }
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Огляд 2026</h1>
          <p className="text-slate-500">Вітаємо, {profile.name}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all md:px-6 md:rounded-xl md:flex md:items-center md:gap-2"
        >
          <Plus size={24} />
          <span className="hidden md:inline">Додати дохід</span>
        </button>
      </div>

      {/* AI Insight Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
        <div className="flex items-start gap-4 relative z-10">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <MessageSquare size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg opacity-90 mb-1">Порада Gemini AI</h3>
            <p className="text-blue-50 leading-relaxed text-sm md:text-base">
              {isLoadingAdvice ? "Аналіз фінансових даних..." : taxAdvice}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Income Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Загальний дохід (Рік)</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                ₴ {totalIncome.toLocaleString()}
              </h3>
            </div>
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Оновлено щойно</p>
        </div>

        {/* Taxes Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500">{taxLabel}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                ₴ {estimatedTaxDisplay.toLocaleString()}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">ЄСВ (Місяць)</p>
              <p className="font-semibold text-slate-700">₴ {esvTotal}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
             <button className="flex-1 py-2 text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-colors">
               Сплатити Податок
             </button>
             <button className="flex-1 py-2 text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-colors">
               Сплатити ЄСВ
             </button>
          </div>
        </div>

        {/* Limit Warning Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
           <div className="flex justify-between items-center mb-2">
             <p className="text-sm font-medium text-slate-500">Ліміт ФОП 2026</p>
             {limitPercent > 80 && <AlertTriangle size={18} className="text-amber-500" />}
           </div>
           
           <div className="flex items-center gap-4">
             <div className="h-24 w-24 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={limitData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={40}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={0}
                      dataKey="value"
                      stroke="none"
                    >
                      {limitData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-slate-700">{limitPercent.toFixed(0)}%</span>
                </div>
             </div>
             <div>
               <p className="text-xs text-slate-400">Залишок</p>
               <p className="font-bold text-slate-800">₴ {limitRemaining.toLocaleString()}</p>
               <p className="text-xs text-slate-400 mt-1">Ліміт: {(limit / 1000000).toFixed(2)}М</p>
             </div>
           </div>
        </div>
      </div>

      {/* Recent Incomes List (Preview) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Останні транзакції</h3>
        <div className="space-y-4">
          {incomes.length === 0 ? (
            <p className="text-center text-slate-400 py-8">Транзакцій поки немає.</p>
          ) : (
            incomes.slice(0, 3).map(inc => (
              <div key={inc.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                     {inc.currency === 'UAH' ? '₴' : inc.currency === 'USD' ? '$' : '€'}
                   </div>
                   <div>
                     <p className="font-medium text-slate-900">{inc.description || "Дохід"}</p>
                     <p className="text-xs text-slate-500">{inc.date}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="font-bold text-slate-900">+{inc.amount.toLocaleString()} {inc.currency}</p>
                   <p className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                     {inc.source === 'ai-scan' ? 'AI' : 'Вручну'}
                   </p>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>

      <IncomeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveIncome}
      />
    </div>
  );
};