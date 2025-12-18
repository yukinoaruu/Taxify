import React, { useState, useRef } from 'react';
import { Camera, Upload, Check, X, Loader2, DollarSign, Calendar, FileText } from 'lucide-react';
import { extractIncomeFromImage } from '../services/geminiService';
import { Income } from '../types';

// Simple UUID generator for this context
const simpleId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (income: Income) => void;
}

export const IncomeModal: React.FC<IncomeModalProps> = ({ isOpen, onClose, onSave }) => {
  const [mode, setMode] = useState<'manual' | 'scan'>('manual');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'UAH' | 'USD' | 'EUR'>('UAH');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [docUrl, setDocUrl] = useState<string | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setDocUrl(base64);
      
      try {
        const data = await extractIncomeFromImage(base64);
        setAmount(data.amount.toString());
        setCurrency(data.currency);
        if (data.date) setDate(data.date);
        if (data.description) setDescription(data.description);
        setMode('manual'); // Switch to review mode
      } catch (err) {
        setError("Не вдалося розпізнати документ. Будь ласка, введіть дані вручну.");
        setMode('manual');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) return;

    const income: Income = {
      id: simpleId(),
      amount: parseFloat(amount),
      currency,
      date,
      description,
      source: docUrl ? 'ai-scan' : 'manual',
      originalDocumentUrl: docUrl
    };

    onSave(income);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setDocUrl(undefined);
    setMode('manual');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800">Додати дохід</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
            <button 
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'manual' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
              onClick={() => setMode('manual')}
            >
              Вручну
            </button>
            <button 
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'scan' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
              onClick={() => setMode('scan')}
            >
              Скан AI
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="animate-spin mb-3 text-blue-600" size={32} />
              <p>Gemini аналізує документ...</p>
            </div>
          ) : mode === 'scan' ? (
            <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                 onClick={() => fileInputRef.current?.click()}>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,.pdf" 
                onChange={handleFileUpload} 
              />
              <div className="bg-blue-100 p-4 rounded-full mb-3">
                <Camera className="text-blue-600" size={32} />
              </div>
              <p className="font-medium text-slate-700">Натисніть для завантаження</p>
              <p className="text-xs text-slate-400 mt-1">Підтримуються JPG, PNG</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {docUrl && (
                <div className="mb-4 p-3 bg-blue-50 text-blue-800 text-sm rounded-lg flex items-center gap-2">
                   <Check size={16} /> Документ розпізнано. Перевірте дані.
                </div>
              )}
              
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Сума</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <span className="text-slate-400 text-sm font-bold">
                       {currency === 'UAH' ? '₴' : currency === 'USD' ? '$' : '€'}
                     </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="0.00"
                  />
                  <select 
                    value={currency} 
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="absolute inset-y-0 right-0 pr-3 bg-transparent text-slate-500 text-sm font-medium outline-none"
                  >
                    <option value="UAH">UAH</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Дата</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-10 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Опис</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="pl-10 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="напр. Розробка ПЗ"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] mt-4"
              >
                Зберегти
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};