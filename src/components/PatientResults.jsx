import React, { useState } from 'react';
import { 
  CheckCircle, AlertTriangle, ArrowRight, Download, 
  ChevronDown, ChevronUp, RotateCcw, FileText, 
  Activity, Shield
} from 'lucide-react';

function PatientResults({ result, onStartOver }) {
  const [showDetails, setShowDetails] = useState(false);
  
  const patientResult = result.patient_result;
  const proResult = result.professional_result;
  
  if (!patientResult) {
    return (
      <div className="card p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Analysis Error</h3>
        <p className="text-slate-600 mb-6">{result.error || 'Something went wrong'}</p>
        <button onClick={onStartOver} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  const confidenceColor = {
    high: 'text-green-600 bg-green-50',
    moderate: 'text-yellow-600 bg-yellow-50',
    low: 'text-orange-600 bg-orange-50',
  }[patientResult.confidence] || 'text-slate-600 bg-slate-50';

  const downloadSummary = () => {
    const blob = new Blob([patientResult.summary_for_doctor], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'symptom-summary.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Primary Result */}
      <div className="result-card">
        <div className="result-header">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8" />
            <div>
              <p className="text-blue-100 text-sm">Most likely</p>
              <h2 className="text-2xl font-bold">{patientResult.most_likely}</h2>
            </div>
          </div>
        </div>
        
        <div className="card-body">
          <p className="text-slate-700 mb-4">
            {patientResult.most_likely_explanation}
          </p>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Confidence:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${confidenceColor}`}>
              {patientResult.confidence.charAt(0).toUpperCase() + patientResult.confidence.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Also Possible */}
      {patientResult.also_possible?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900">Also possible</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {patientResult.also_possible.map((item, idx) => (
              <div key={idx} className="px-6 py-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-sm text-slate-500 flex-shrink-0 mt-0.5">
                    {idx + 2}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{item.reason}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* When to See Doctor */}
      <div className="card border-l-4 border-l-primary-500">
        <div className="card-body">
          <div className="flex items-start gap-3">
            <Activity className="w-6 h-6 text-primary-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">When to see a doctor</h3>
              <p className="text-slate-700">{patientResult.when_to_see_doctor}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Red Flags */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-400" />
            <h3 className="font-semibold text-slate-900">Watch for these warning signs</h3>
          </div>
        </div>
        <div className="card-body">
          <ul className="space-y-2">
            {patientResult.red_flags_to_watch?.map((flag, idx) => (
              <li key={idx} className="flex items-center gap-2 text-slate-700">
                <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Doctor Summary */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="card-body">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Summary for your doctor</h3>
                <p className="text-blue-700 text-sm">
                  Take this with you to your appointment to help your doctor understand your symptoms.
                </p>
              </div>
            </div>
            <button
              onClick={downloadSummary}
              className="btn btn-primary flex items-center gap-2 flex-shrink-0"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Technical Details (collapsible) */}
      {proResult && (
        <div className="card">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full card-header flex items-center justify-between hover:bg-slate-50"
          >
            <h3 className="font-semibold text-slate-900">Technical analysis</h3>
            {showDetails ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>
          
          {showDetails && (
            <div className="card-body border-t border-slate-100">
              {/* Data Geometry */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Data Geometry
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Spectral Gap</p>
                    <p className="text-lg font-bold text-slate-900">
                      {proResult.geometry?.spectral_gap?.toFixed(1)}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Feature Clusters</p>
                    <p className="text-lg font-bold text-slate-900">
                      {proResult.geometry?.feature_clusters}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Score Spread</p>
                    <p className="text-lg font-bold text-slate-900">
                      {(proResult.geometry?.score_spread * 100)?.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Top Gap</p>
                    <p className="text-lg font-bold text-slate-900">
                      {(proResult.geometry?.top_gap * 100)?.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-3">
                  {proResult.geometry?.interpretation}
                </p>
              </div>

              {/* Full Differential */}
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Full Differential ({proResult.differential?.length} considered)
                </h4>
                <div className="space-y-2">
                  {proResult.differential?.slice(0, 10).map((dx, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-sm text-slate-400 w-6">{idx + 1}.</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700">{dx.name}</span>
                          <span className="text-sm text-slate-500">{(dx.score * 100).toFixed(0)}%</span>
                        </div>
                        <div className="confidence-bar">
                          <div 
                            className="confidence-fill bg-primary-500"
                            style={{ width: `${dx.score * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Start Over */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onStartOver}
          className="btn btn-secondary flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Analyze new symptoms
        </button>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-sm text-slate-500 pb-8">
        <p>
          This is an educational tool and does not provide medical advice.
          <br />
          Always consult a healthcare professional for medical concerns.
        </p>
      </div>
    </div>
  );
}

export default PatientResults;
