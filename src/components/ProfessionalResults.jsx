import React, { useState } from 'react';
import { 
  CheckCircle, AlertTriangle, RotateCcw, Activity,
  TrendingUp, Target, Layers, GitBranch, Copy, Check,
  Download, AlertCircle, ShieldAlert, Pill, FileText, XCircle
} from 'lucide-react';

// API base URL - adjust as needed
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
  const [downloadingReport, setDownloadingReport] = useState(false);
  
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
  const selectedHypothesis = proResult.selected_hypothesis || differential[0] || null;
  const spectralRisk = proResult.spectral_risk || null;
  const drugAlerts = proResult.drug_alerts || [];
  const inputQuality = proResult.input_quality || null;
  const similarDiagnoses = proResult.similar_diagnoses || [];

  // Check if input is valid - THIS IS THE KEY CHECK
  const isInputInvalid = inputQuality && !inputQuality.is_valid;

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

  const getRiskColor = (level) => {
    switch (level) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'moderate': return 'bg-yellow-500 text-slate-900';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-slate-400 text-white';
    }
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

  // Download PDF report
  const downloadReport = async () => {
    setDownloadingReport(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/report/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professional_result: proResult,
          report_id: `MCQ-${Date.now()}`
        })
      });

      if (!response.ok) throw new Error('Report generation failed');

      const { pdf_base64, filename } = await response.json();

      // Create download link
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${pdf_base64}`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Report download failed:', error);
      alert('Failed to generate report. The report feature may not be available on this deployment.');
    } finally {
      setDownloadingReport(false);
    }
  };

  // =====================================================
  // IF INPUT IS INVALID, SHOW ONLY THE WARNING
  // =====================================================
  if (isInputInvalid) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Input Quality Warning - MAIN CONTENT */}
        <div className="card border-l-4 border-l-red-500 bg-red-50">
          <div className="card-body">
            <div className="flex items-start gap-3">
              <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-bold text-red-900 mb-2">
                  Unable to Provide Reliable Diagnosis
                </h2>
                <p className="text-red-700">
                  {inputQuality.warning_message}
                </p>
                {inputQuality.recommendation && (
                  <p className="text-red-600 mt-3">
                    <strong>Recommendation:</strong> {inputQuality.recommendation}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-4 text-sm text-red-600">
                  <span className="px-2 py-1 bg-red-100 rounded">
                    Quality: {inputQuality.quality_level}
                  </span>
                  <span className="px-2 py-1 bg-red-100 rounded">
                    Unique scores: {inputQuality.medical_signal_count}
                  </span>
                  <span className="px-2 py-1 bg-red-100 rounded">
                    Score variance: {inputQuality.medical_signal_density?.toFixed(3) || '0'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900">Why can't MCQ Oracle analyze this?</h3>
          </div>
          <div className="card-body">
            <p className="text-slate-600 mb-4">
              MCQ Oracle uses spectral geometry to differentiate between diagnostic hypotheses. 
              When all hypotheses score identically, it indicates that the input lacks 
              clinical information that would help distinguish one diagnosis from another.
            </p>
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 mb-2">For best results, provide:</h4>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Patient symptoms and chief complaint
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Relevant medical history
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Physical examination findings
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Vital signs and investigation results
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center pt-4">
          <button
            onClick={onStartOver}
            className="btn btn-primary flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again with Clinical Information
          </button>
        </div>

        {/* Disclaimer */}
        <div className="text-center text-sm text-slate-500 pb-8">
          <p>
            Clinical decision support tool — requires clinical information to function.
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // NORMAL RENDERING - Only if input is VALID
  // =====================================================
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
        <div className="flex gap-2">
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
          <button
            onClick={downloadReport}
            disabled={downloadingReport}
            className="btn btn-primary flex items-center gap-2"
          >
            {downloadingReport ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Download Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Critical Alerts (only shown if there are actual alerts) */}
      {spectralRisk && spectralRisk.alerts && spectralRisk.alerts.length > 0 && (
        <div className="card border-l-4 border-l-red-600 bg-red-50">
          <div className="card-body">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 flex-shrink-0 text-red-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-red-900">
                  Critical Alerts
                </h3>
                
                <div className="mt-3 space-y-2">
                  {spectralRisk.alerts.slice(0, 3).map((alert, idx) => (
                    <div key={idx} className="bg-white bg-opacity-60 rounded p-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{alert.category}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          alert.severity === 'critical' ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        <strong>Action:</strong> {alert.action}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Drug Alerts */}
      {drugAlerts && drugAlerts.length > 0 && (
        <div className="card border-l-4 border-l-purple-500">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-slate-900">Drug Interaction Alerts</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {drugAlerts.slice(0, 3).map((alert, idx) => (
                <div key={idx} className="bg-purple-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-purple-900">
                      {alert.drug} → {alert.syndrome?.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      alert.severity === 'severe' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm text-purple-700 mt-1">{alert.mechanism}</p>
                </div>
              ))}
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-xs text-slate-500 mb-1">Spectral Gap (Δ)</p>
                <p className="text-2xl font-bold text-slate-900">
                  {geometry.spectral_gap?.toFixed(2) || 'N/A'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-xs text-slate-500 mb-1">Viscosity (λ)</p>
                <p className="text-2xl font-bold text-slate-900">
                  {geometry.information_viscosity?.toFixed(3) || 'N/A'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-xs text-slate-500 mb-1">Entropy (S)</p>
                <p className="text-2xl font-bold text-slate-900">
                  {geometry.von_neumann_entropy?.toFixed(2) || 'N/A'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-xs text-slate-500 mb-1">Curvature (κ)</p>
                <p className="text-2xl font-bold text-slate-900">
                  {geometry.mean_curvature?.toFixed(2) || 'N/A'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-xs text-slate-500 mb-1">Confidence</p>
                <p className={`text-2xl font-bold ${
                  geometry.confidence_level === 'high' ? 'text-green-600' :
                  geometry.confidence_level === 'moderate' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {geometry.confidence_score ? `${(geometry.confidence_score * 100).toFixed(0)}%` : 'N/A'}
                </p>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 bg-blue-50 rounded-lg p-3">
              <strong>Interpretation:</strong> {geometry.interpretation || 'Analysis complete'}
            </p>
          </div>
        </div>
      )}

      {/* Similar Diagnoses Warning */}
      {similarDiagnoses && similarDiagnoses.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-slate-900">Diagnoses Requiring Differentiation</h3>
            </div>
          </div>
          <div className="card-body">
            <p className="text-sm text-slate-600 mb-3">
              These diagnosis pairs have high similarity and may need additional tests to differentiate:
            </p>
            <div className="space-y-2">
              {similarDiagnoses.slice(0, 3).map((pair, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{pair.diagnosis_a}</span>
                  <span className="text-slate-400">↔</span>
                  <span className="font-medium">{pair.diagnosis_b}</span>
                  <span className="text-xs text-slate-500">(κ={pair.curvature?.toFixed(2)})</span>
                </div>
              ))}
            </div>
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
                        {dx.drug_induced_flag && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                            💊 Drug-related
                          </span>
                        )}
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
                    
                    {/* Drug note */}
                    {dx.drug_note && (
                      <p className="text-sm text-purple-600 mb-2 italic">
                        {dx.drug_note}
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

      {/* Score Distribution Chart */}
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
      <div className="flex justify-center gap-4 pt-4">
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
