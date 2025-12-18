import React, { useState } from 'react';
import { UserProfile } from '../types';
import { FileText, Download, Loader2, Table } from 'lucide-react';
import { dbService } from '../services/dbService';
import { generateReportContent } from '../services/geminiService';

export const Reports: React.FC<{ profile: UserProfile }> = ({ profile }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Helper to trigger download
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAIReport = async (reportName: string) => {
    setIsGenerating(true);
    
    // Gather context
    const incomes = dbService.getIncomes();
    const total = incomes.reduce((acc, curr) => acc + curr.amount, 0);
    const tax = total * profile.taxRate;
    
    const context = `
      Тип звіту: ${reportName}
      ПІБ ФОП: ${profile.name}
      Група: ${profile.group}
      Загальний дохід: ${total} UAH
      Податок до сплати: ${tax} UAH
      Кількість операцій: ${incomes.length}
    `;

    // Gemini Call
    const content = await generateReportContent(reportName, context);
    
    downloadFile(content, `${reportName}_${new Date().toISOString().split('T')[0]}.txt`, 'text/plain');
    setIsGenerating(false);
  };

  const handleCsvExport = () => {
    const incomes = dbService.getIncomes();
    const headers = "ID,Date,Amount,Currency,Description,Source\n";
    const rows = incomes.map(i => 
      `${i.id},${i.date},${i.amount},${i.currency},"${i.description.replace(/"/g, '""')}",${i.source}`
    ).join("\n");
    
    downloadFile(headers + rows, 'book_of_income.csv', 'text/csv');
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Звіти та декларації</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gemini AI Reports */}
        <button
          onClick={() => handleAIReport('Декларація_ФОП')}
          disabled={isGenerating}
          className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 rounded-lg text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Декларація платника ЄП</h3>
              <p className="text-xs text-slate-500">Генерується AI • Текстовий формат</p>
            </div>
          </div>
          {isGenerating ? <Loader2 className="animate-spin text-blue-500" /> : <Download size={20} className="text-slate-300 group-hover:text-blue-500" />}
        </button>

        <button
          onClick={() => handleAIReport('Звіт_ЄСВ')}
          disabled={isGenerating}
          className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 rounded-lg text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Звіт по ЄСВ (Додаток 1)</h3>
              <p className="text-xs text-slate-500">Генерується AI • Текстовий формат</p>
            </div>
          </div>
          {isGenerating ? <Loader2 className="animate-spin text-blue-500" /> : <Download size={20} className="text-slate-300 group-hover:text-blue-500" />}
        </button>

        {/* CSV Export */}
        <button
          onClick={handleCsvExport}
          className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all group text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 rounded-lg text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
              <Table size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Книга доходів</h3>
              <p className="text-xs text-slate-500">Експорт в Excel (CSV)</p>
            </div>
          </div>
          <Download size={20} className="text-slate-300 group-hover:text-emerald-500" />
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>Примітка:</strong> Звіти, згенеровані AI, є довідковими. Будь ласка, перевіряйте цифри перед подачею офіційної звітності в податкову.
      </div>
    </div>
  );
};