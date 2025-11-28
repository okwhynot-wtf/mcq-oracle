import React, { useState } from 'react';
import { Activity, Shield, Sparkles, BarChart3 } from 'lucide-react';
import UnifiedMode from './components/UnifiedMode';
import UnifiedResults from './components/UnifiedResults';
import { analyzeSymptoms } from './api/client';

function App() {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async (inputData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the API with unified input
      const response = await analyzeSymptoms(inputData, 'professional');
      
      if (response.success) {
        setResult(response);
      } else {
        // Check if there's a patient result with quality info
        if (response.patient_result?.input_quality) {
          setResult(response);
        } else {
          setError(response.error || 'Analysis failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to connect to the analysis service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewAnalysis = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">MCQ Oracle</h1>
                <p className="text-xs text-slate-500">Spectral Diagnostic Reasoning</p>
              </div>
            </div>
            
            {/* Math-first badges with tooltips */}
            <div className="hidden md:flex items-center gap-4">
              <div className="relative group">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full cursor-help">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm text-indigo-700 font-medium">Matrix-based Analysis</span>
                </div>
                {/* Tooltip */}
                <div className="absolute top-full right-0 mt-2 w-72 p-4 bg-gray-900 text-white text-sm rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="font-semibold mb-2 text-indigo-300">Matrix Completion Query (MCQ)</div>
                  <p className="text-gray-300 leading-relaxed">
                    Unlike chatbots that generate text, MCQ Oracle builds a <span className="text-white font-medium">feature matrix</span> where each hypothesis is scored against clinical findings using pointwise mutual information.
                  </p>
                  <p className="text-gray-300 leading-relaxed mt-2">
                    This produces <span className="text-white font-medium">quantitative probability scores</span> rather than qualitative guesses.
                  </p>
                  <div className="absolute -top-2 right-6 w-4 h-4 bg-gray-900 transform rotate-45"></div>
                </div>
              </div>
              <div className="relative group">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full cursor-help">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-purple-700 font-medium">Spectral Geometry</span>
                </div>
                {/* Tooltip */}
                <div className="absolute top-full right-0 mt-2 w-72 p-4 bg-gray-900 text-white text-sm rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="font-semibold mb-2 text-purple-300">Spectral Analysis</div>
                  <p className="text-gray-300 leading-relaxed">
                    The feature matrix is analysed using <span className="text-white font-medium">eigenvalue decomposition</span> to measure diagnostic certainty.
                  </p>
                  <p className="text-gray-300 leading-relaxed mt-2">
                    Metrics like <span className="text-white font-medium">spectral gap</span> (separation between hypotheses) and <span className="text-white font-medium">Ollivier-Ricci curvature</span> (diagnosis clustering) quantify confidence mathematically.
                  </p>
                  <div className="absolute -top-2 right-6 w-4 h-4 bg-gray-900 transform rotate-45"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-medium text-red-800">Analysis Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={handleNewAnalysis}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {result ? (
          <UnifiedResults result={result} onNewAnalysis={handleNewAnalysis} />
        ) : (
          <UnifiedMode onAnalyze={handleAnalyze} isLoading={isLoading} />
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-slate-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Educational and research tool only — always consult a healthcare professional for medical advice</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-400">Powered by</span>
              <span className="font-medium text-indigo-600">MCQ Spectral Analysis</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
