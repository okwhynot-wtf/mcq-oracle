import React, { useState } from 'react';
import { 
  CheckCircle, AlertTriangle, RotateCcw, Activity,
  TrendingUp, Target, Layers, GitBranch, Copy, Check
} from 'lucide-react';

// Helper to safely get string from item (handles both strings and objects)
const getDisplayText = (item) => {
  if (typeof item === 'string') return item;
  if (item?.name) return item.name;
  if (item?.text) return item.text;
  if (item?.value) return item.value;
  if (item?.feature) return item.feature;
  if (item?.flag) return item.flag;
  return JSON.stringify(item);
};

function ProfessionalResults({ result, onStartOver }) {
  const [copiedId, setCopiedId] = useState(null);
  
  // Debug: log the result structure
  console.log('Professional Result:', JSON.stringify(result, null, 2));
  
  if (!result || result.error || !result.success) {
    return (
      <div className="card p-8 text-center max-w-2xl mx-auto">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Analysis Error</h3>
        <p className="text-slate-600 mb-6">{result?.error || 'Something went wrong'}</p>
        <button onClick={onStartOver} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  // Extract from professional_result wrapper
  const proResult = result.professional_result || {};
  const differential = proResult.differential || [];
  const geometry = proResult.geometry || null;
  const metadata = proResult.metadata || result.metadata || {};
  const clinical_pearls = proResult.clinical_pearls || [];
  const selectedHypothesis = proResult.selected_hypothesis || differential[0] || null;

  const copyToClipboard = async (text, id) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getScoreColor = (score) => {
    if (score >= 0.7) return 'bg-green-500';
    if (score >= 0.4) return 'bg-yellow-500';
    if (score >= 0.2) return 'bg-orange-500';
    return 'bg-red-400';
  };

  const formatDifferentialForCopy = () => {
    if (!differential || differential.length === 0) return '';
    return differential
      .map((dx, i) => {
        const findings = dx.findings_explained?.filter(f => f !== 'none').join(', ') || '';
        return `${dx.rank || i + 1}. ${dx.name} (${(dx.score * 100).toFixed(0)}%)${findings ? ` - ${findings}` : ''}`;
      })
      .join('\n');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Differential Diagnosis</h2>
          <p className="text-slate-600">
            {differential.length} diagnoses considered • MCQ Oracle
          </p>
        </div>
        {differential.length > 0 && (
          <button
            onClick={() => copyToClipboard(formatDifferentialForCopy(), 'all')}
            className="btn btn-secondary flex items-center gap-2"
          >
            {copiedId === 'all' ? (
              <>
                <Check className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy All
              </>
            )}
          </button>
        )}
      </div>

      {/* Selected Hypothesis */}
      {selectedHypothesis && (
        <div className="card border-l-4 border-l-green-500">
          <div className="card-body">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">{selectedHypothesis.name}</h3>
                <p className="text-slate-600 mt-1">
                  Score: {(selectedHypothesis.score * 100).toFixed(0)}% • 
                  Coverage: {(selectedHypothesis.coverage * 100).toFixed(0)}%
                </p>
                {selectedHypothesis.findings_explained?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-slate-500">Explains:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedHypothesis.findings_explained.filter(f => f !== 'none').map((finding, i) => (
                        <span key={i} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                          {getDisplayText(finding)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Geometry Overview */}
      {geometry && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-slate-400" />
              <h3 className="font-semibold text-slate-900">Data Geometry Analysis</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <TrendingUp className="w-5 h-5 text-primary-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900">
                  {geometry.spectral_gap?.toFixed(1) || 'N/A'}
                </p>
                <p className="text-xs text-slate-500">Spectral Gap</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <Target className="w-5 h-5 text-primary-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900">
                  {geometry.feature_clusters || 'N/A'}
                </p>
                <p className="text-xs text-slate-500">Feature Clusters</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <Activity className="w-5 h-5 text-primary-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900">
                  {geometry.score_spread ? `${(geometry.score_spread * 100).toFixed(0)}%` : 'N/A'}
                </p>
                <p className="text-xs text-slate-500">Score Spread</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <GitBranch className="w-5 h-5 text-primary-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900">
                  {geometry.top_gap ? `${(geometry.top_gap * 100).toFixed(0)}%` : 'N/A'}
                </p>
                <p className="text-xs text-slate-500">Top Gap</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 bg-blue-50 rounded-lg p-3">
              <strong>Interpretation:</strong> {geometry.interpretation || 'Analysis complete'}
            </p>
          </div>
        </div>
      )}

      {/* Main Differential */}
      {differential.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900">Ranked Differential</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {differential.map((dx, idx) => (
              <div 
                key={idx}
                className={`p-4 ${idx === 0 ? 'bg-primary-50' : 'hover:bg-slate-50'} transition-colors`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    idx === 0 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {dx.rank || idx + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <h4 className={`font-semibold ${idx === 0 ? 'text-primary-900' : 'text-slate-900'}`}>
                        {dx.name}
                      </h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-medium text-slate-600">
                          {(dx.score * 100).toFixed(0)}%
                        </span>
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getScoreColor(dx.score)}`}
                            style={{ width: `${dx.score * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Coverage info */}
                    {dx.coverage && (
                      <p className="text-sm text-slate-500 mb-2">
                        Coverage: {(dx.coverage * 100).toFixed(0)}%
                      </p>
                    )}
                    
                    {/* Findings explained */}
                    {dx.findings_explained && dx.findings_explained.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {dx.findings_explained.filter(f => f !== 'none').map((feature, fidx) => (
                          <span 
                            key={fidx}
                            className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs"
                          >
                            ✓ {getDisplayText(feature)}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Findings unexplained */}
                    {dx.findings_unexplained && dx.findings_unexplained.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {dx.findings_unexplained.map((finding, fidx) => (
                          <span 
                            key={fidx}
                            className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded text-xs"
                          >
                            ? {getDisplayText(finding)}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Features */}
                    {dx.features && (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                        {dx.features.severity && (
                          <span className={`px-2 py-0.5 rounded ${
                            dx.features.severity === 'life_threatening' ? 'bg-red-100 text-red-700' :
                            dx.features.severity === 'severe' ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-100'
                          }`}>
                            {dx.features.severity.replace('_', ' ')}
                          </span>
                        )}
                        {dx.features.acuity && (
                          <span className="px-2 py-0.5 bg-slate-100 rounded">{dx.features.acuity}</span>
                        )}
                        {dx.features.system && (
                          <span className="px-2 py-0.5 bg-slate-100 rounded">{dx.features.system}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clinical Pearls */}
      {clinical_pearls && clinical_pearls.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900">Clinical Pearls</h3>
          </div>
          <div className="card-body">
            <ul className="space-y-2">
              {clinical_pearls.map((pearl, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{getDisplayText(pearl)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Score Distribution Chart (Simple) */}
      {differential.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900">Score Distribution</h3>
          </div>
          <div className="card-body">
            <div className="space-y-2">
              {differential.slice(0, 10).map((dx, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-4 text-right">{dx.rank || idx + 1}</span>
                  <span className="text-sm text-slate-700 w-40 truncate" title={dx.name}>
                    {dx.name}
                  </span>
                  <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
                    <div 
                      className={`h-full ${getScoreColor(dx.score)} flex items-center justify-end pr-2`}
                      style={{ width: `${Math.max(dx.score * 100, 5)}%` }}
                    >
                      <span className="text-xs text-white font-medium">
                        {(dx.score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-center text-sm text-slate-500">
        <p>
          MCQ Oracle Professional Analysis • {differential.length} diagnoses evaluated
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onStartOver}
          className="btn btn-secondary flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          New Analysis
        </button>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-sm text-slate-500 pb-8">
        <p>
          Clinical decision support tool — verify with clinical judgment and appropriate investigations.
        </p>
      </div>
    </div>
  );
}

export default ProfessionalResults;
