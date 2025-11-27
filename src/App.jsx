import React, { useState } from 'react';
import { Stethoscope, Users, Activity, Shield } from 'lucide-react';
import PatientMode from './components/PatientMode';
import ProfessionalMode from './components/ProfessionalMode';

function App() {
  const [mode, setMode] = useState('patient'); // 'patient' | 'professional'
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">MCQ Oracle</h1>
                <p className="text-xs text-slate-500">Think through your symptoms</p>
              </div>
            </div>
            
            {/* Mode Switcher */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setMode('patient')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'patient' 
                    ? 'bg-white text-primary-600 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                Patient
              </button>
              <button
                onClick={() => setMode('professional')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'professional' 
                    ? 'bg-white text-primary-600 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                Professional
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {mode === 'patient' ? <PatientMode /> : <ProfessionalMode />}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Educational tool only — always consult a healthcare professional</span>
            </div>
            <div>
              Powered by MCQ structured reasoning
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
