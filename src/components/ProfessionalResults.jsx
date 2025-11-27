import React, { useState } from 'react';
import { 
  CheckCircle, AlertTriangle, RotateCcw, Activity,
  TrendingUp, Target, Layers, GitBranch, Copy, Check
} from 'lucide-react';

function ProfessionalResults({ result, onStartOver }) {
  const [copiedId, setCopiedId] = useState(null);
  
  if (!result || result.error) {
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

  const { differential, geometry, metadata, clinical_pearls } = result;

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
    return differential
      .map((dx, i) => `${i + 1}. ${dx.name} (${(dx.score * 100).toFixed(0)}%)${dx.key_features ? ` - ${dx.key_features.join(', ')}` : ''}`)
      .join('\n');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Differential Diagnosis</h2>
          <p className="text-slate-600">
            {differential.length} diagnoses considered • {metadata?.model_version || 'MCQ Oracle'}
          </p>
        </div>
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
      </div>

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
                  {idx + 1}
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
                  
                  {dx.reasoning && (
                    <p className="text-sm text-slate-600 mb-2">{dx.reasoning}</p>
                  )}
                  
                  {dx.key_features && dx.key_features.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {dx.key_features.map((feature, fidx) => (
                        <span 
                          key={fidx}
                          className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {dx.red_flags && dx.red_flags.length > 0 && (
                    <div className="mt-2 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex flex-wrap gap-1.5">
                        {dx.red_flags.map((flag, fidx) => (
                          <span 
                            key={fidx}
                            className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs"
                          >
                            {flag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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
                  <span className="text-slate-700">{pearl}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Score Distribution Chart (Simple) */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-slate-900">Score Distribution</h3>
        </div>
        <div className="card-body">
          <div className="space-y-2">
            {differential.slice(0, 10).map((dx, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-4 text-right">{idx + 1}</span>
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

      {/* Metadata */}
      {metadata && (
        <div className="text-center text-sm text-slate-500">
          <p>
            Processing time: {metadata.processing_time_ms?.toFixed(0) || 'N/A'}ms • 
            Model: {metadata.model_version || 'MCQ Oracle'} • 
            Template: {metadata.template_used || 'default'}
          </p>
        </div>
      )}

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
