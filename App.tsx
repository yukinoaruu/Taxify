import React, { useState, useEffect } from 'react';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Reports } from './pages/Reports';
import { Login } from './pages/Login';
import { dbService } from './services/dbService';
import { authService } from './services/authService';
import { UserProfile, ViewState } from './types';
import { LayoutGrid, FileText, Settings, Wallet, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('login');

  useEffect(() => {
    // Check Authentication
    if (authService.isAuthenticated()) {
      const loadedProfile = dbService.getProfile();
      setProfile(loadedProfile);
      
      if (!loadedProfile.isOnboarded) {
        setCurrentView('onboarding');
      } else {
        setCurrentView('dashboard');
      }
    } else {
      setCurrentView('login');
    }
  }, []);

  const handleLoginSuccess = () => {
    const p = dbService.getProfile();
    setProfile(p);
    if (!p.isOnboarded) {
      setCurrentView('onboarding');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleOnboardingComplete = () => {
    const p = dbService.getProfile();
    setProfile(p);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    authService.logout();
  };

  if (currentView === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentView === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed h-full z-10">
        <div className="p-6">
          <div className="flex items-center gap-2 text-blue-700 mb-8">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
             <span className="text-xl font-bold tracking-tight">Taxify AI</span>
          </div>
          
          <nav className="space-y-1">
            <NavItem 
              icon={<LayoutGrid size={20}/>} 
              label="Огляд" 
              active={currentView === 'dashboard'} 
              onClick={() => setCurrentView('dashboard')} 
            />
            <NavItem 
              icon={<Wallet size={20}/>} 
              label="Доходи" 
              active={currentView === 'incomes'} 
              onClick={() => setCurrentView('dashboard')} 
            />
            <NavItem 
              icon={<FileText size={20}/>} 
              label="Звіти" 
              active={currentView === 'reports'} 
              onClick={() => setCurrentView('reports')} 
            />
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-slate-100">
           <div className="flex items-center gap-3 mb-4">
             {profile.photoUrl ? (
               <img src={profile.photoUrl} alt="User" className="w-10 h-10 rounded-full" />
             ) : (
               <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                 <Settings size={20} />
               </div>
             )}
             <div className="overflow-hidden">
               <p className="text-sm font-medium text-slate-900 truncate">{profile.name}</p>
               <p className="text-xs text-slate-400">Група {profile.group}</p>
             </div>
           </div>
           
           <button 
             onClick={handleLogout}
             className="w-full flex items-center gap-2 text-sm text-red-600 hover:text-red-700 px-2 py-1"
           >
             <LogOut size={16} /> Вийти
           </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-20 px-4 py-3 flex justify-between items-center">
         <span className="font-bold text-slate-900">Taxify AI</span>
         <button className="p-2 bg-slate-100 rounded-lg text-slate-600" onClick={() => setCurrentView('settings')}>
           <Settings size={20} />
         </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0">
        {currentView === 'dashboard' && <Dashboard profile={profile} />}
        {currentView === 'reports' && <Reports profile={profile} />}
        {currentView === 'settings' && (
          <div className="p-4">
            <h2 className="text-xl font-bold">Налаштування</h2>
             <button 
                onClick={handleLogout}
                className="mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg w-full md:w-auto"
             >
               Вийти з акаунту
             </button>
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-20 flex justify-around p-2 pb-safe">
          <MobileNavItem icon={<LayoutGrid size={24}/>} label="Головна" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
          <MobileNavItem icon={<FileText size={24}/>} label="Звіти" active={currentView === 'reports'} onClick={() => setCurrentView('reports')} />
      </div>
    </div>
  );
};

// Nav Components
const NavItem = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
  >
    {icon}
    {label}
  </button>
);

const MobileNavItem = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 rounded-lg ${active ? 'text-blue-600' : 'text-slate-400'}`}
  >
    {icon}
    <span className="text-[10px] font-medium mt-1">{label}</span>
  </button>
);

export default App;