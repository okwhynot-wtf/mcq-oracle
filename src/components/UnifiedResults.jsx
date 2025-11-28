import { useState, useEffect, useRef } from 'react';

/**
 * UnifiedResults - Rich visualization of MCQ Oracle analysis
 * 
 * Features:
 * - Top diagnosis with confidence metrics
 * - Interactive differential table
 * - Score distribution visualization
 * - Feature matrix heatmap
 * - Hypothesis similarity network
 * - Spectral geometry metrics
 * - Reasoning chain
 * - Download report
 */
export default function UnifiedResults({ result, onNewAnalysis }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Get the professional result (contains all the detailed data)
  const prof = result.professional_result;
  if (!prof) {
    return (
      <div className="text-center py-12 text-gray-500">
        No analysis results available
      </div>
    );
  }

  const differential = prof.differential || [];
  const geometry = prof.geometry || {};
  const context = prof.context || {};
  const reasoningChain = prof.reasoning_chain || [];
  const drugAlerts = prof.drug_alerts || [];
  const similarDiagnoses = prof.similar_diagnoses || [];
  const inputQuality = prof.input_quality;

  // Check if input was flagged as insufficient
  if (inputQuality && !inputQuality.is_valid) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-amber-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-amber-800 mb-2">Unable to Generate Analysis</h3>
              <p className="text-amber-700 mb-4">{inputQuality.warning_message}</p>
              {inputQuality.recommendation && (
                <p className="text-sm text-amber-600">{inputQuality.recommendation}</p>
              )}
            </div>
          </div>
          <button
            onClick={onNewAnalysis}
            className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const topHypothesis = differential[0];

  // Download report handler
  const handleDownloadReport = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch('/api/report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professional_result: prof,
          report_id: `mcq_${Date.now()}`
        })
      });
      
      if (!response.ok) throw new Error('Report generation failed');
      
      const data = await response.json();
      if (data.pdf_base64) {
        const byteCharacters = atob(data.pdf_base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename || 'mcq_oracle_report.pdf';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Could not generate report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'differential', label: 'Differential' },
    { id: 'visualizations', label: 'Visualizations' },
    { id: 'geometry', label: 'Geometry' },
    { id: 'reasoning', label: 'Reasoning' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with top diagnosis */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl p-6 text-white shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-indigo-200 text-sm font-medium mb-1">Leading Hypothesis</p>
            <h1 className="text-3xl font-bold mb-2">{topHypothesis?.name || 'Unknown'}</h1>
            <div className="flex items-center gap-4 mt-3">
              <div className="bg-white/20 rounded-lg px-3 py-1.5">
                <span className="text-sm">Score: </span>
                <span className="font-bold">{(topHypothesis?.score * 100).toFixed(1)}%</span>
              </div>
              <div className="bg-white/20 rounded-lg px-3 py-1.5">
                <span className="text-sm">Coverage: </span>
                <span className="font-bold">{(topHypothesis?.coverage * 100).toFixed(0)}%</span>
              </div>
              {geometry.confidence_level && (
                <div className={`rounded-lg px-3 py-1.5 ${
                  geometry.confidence_level === 'high' ? 'bg-green-500/30' :
                  geometry.confidence_level === 'moderate' ? 'bg-yellow-500/30' : 'bg-red-500/30'
                }`}>
                  <span className="text-sm">Confidence: </span>
                  <span className="font-bold capitalize">{geometry.confidence_level}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadReport}
              disabled={isDownloading}
              className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              {isDownloading ? (
                <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              Download Report
            </button>
            <button
              onClick={onNewAnalysis}
              className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Drug Alerts */}
      {drugAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-semibold text-red-800 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Drug Interaction Alerts
          </h3>
          <ul className="space-y-1">
            {drugAlerts.map((alert, i) => (
              <li key={i} className="text-sm text-red-700">• {alert.message || JSON.stringify(alert)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <OverviewTab 
              topHypothesis={topHypothesis} 
              differential={differential}
              geometry={geometry}
              context={context}
            />
          )}
          {activeTab === 'differential' && (
            <DifferentialTab differential={differential} />
          )}
          {activeTab === 'visualizations' && (
            <VisualizationsTab 
              differential={differential} 
              similarDiagnoses={similarDiagnoses}
              geometry={geometry}
            />
          )}
          {activeTab === 'geometry' && (
            <GeometryTab geometry={geometry} differential={differential} />
          )}
          {activeTab === 'reasoning' && (
            <ReasoningTab reasoningChain={reasoningChain} />
          )}
        </div>
      </div>
    </div>
  );
}


// =============================================================================
// TAB COMPONENTS
// =============================================================================

function OverviewTab({ topHypothesis, differential, geometry, context }) {
  return (
    <div className="space-y-6">
      {/* Key Findings */}
      {context.key_findings && context.key_findings.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Key Clinical Findings</h3>
          <div className="flex flex-wrap gap-2">
            {context.key_findings.map((finding, i) => (
              <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {finding}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top 5 Hypotheses Mini Table */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Top 5 Differential Diagnoses</h3>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diagnosis</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coverage</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key Discriminator</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {differential.slice(0, 5).map((hyp, i) => (
                <tr key={i} className={i === 0 ? 'bg-indigo-50' : ''}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">#{i + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{hyp.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{ width: `${hyp.score * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{(hyp.score * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{(hyp.coverage * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3 text-sm text-gray-500 italic">{hyp.discriminator || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Spectral Gap" 
          value={geometry.spectral_gap?.toFixed(3) || '—'} 
          sublabel="Higher = more certainty"
        />
        <StatCard 
          label="Score Spread" 
          value={geometry.score_spread ? `${(geometry.score_spread * 100).toFixed(1)}%` : '—'} 
          sublabel="Range of scores"
        />
        <StatCard 
          label="Entropy" 
          value={geometry.von_neumann_entropy?.toFixed(3) || '—'} 
          sublabel="Information content"
        />
        <StatCard 
          label="Hypotheses" 
          value={differential.length} 
          sublabel="Generated"
        />
      </div>

      {/* Interpretation */}
      {geometry.interpretation && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Interpretation</h4>
          <p className="text-gray-700">{geometry.interpretation}</p>
        </div>
      )}
    </div>
  );
}


function DifferentialTab({ differential }) {
  const [expandedRow, setExpandedRow] = useState(null);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        Click on a row to see detailed findings explained/unexplained and features.
      </p>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diagnosis</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coverage</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coherence</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discriminator</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {differential.map((hyp, i) => (
              <>
                <tr 
                  key={i} 
                  onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                  className={`cursor-pointer hover:bg-gray-50 ${expandedRow === i ? 'bg-indigo-50' : ''}`}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{hyp.rank || i + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{hyp.name}</td>
                  <td className="px-4 py-3">
                    <ScoreBar score={hyp.score} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{(hyp.coverage * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{hyp.coherence?.toFixed(3) || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{hyp.discriminator || '—'}</td>
                </tr>
                {expandedRow === i && (
                  <tr key={`${i}-expanded`}>
                    <td colSpan={6} className="px-4 py-4 bg-gray-50">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-green-700 mb-2">Findings Explained</h4>
                          <ul className="text-sm space-y-1">
                            {(hyp.findings_explained || []).map((f, j) => (
                              <li key={j} className="flex items-center text-green-600">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {f}
                              </li>
                            ))}
                            {(!hyp.findings_explained || hyp.findings_explained.length === 0) && (
                              <li className="text-gray-400 italic">None listed</li>
                            )}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-red-700 mb-2">Findings Unexplained</h4>
                          <ul className="text-sm space-y-1">
                            {(hyp.findings_unexplained || []).map((f, j) => (
                              <li key={j} className="flex items-center text-red-600">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                {f}
                              </li>
                            ))}
                            {(!hyp.findings_unexplained || hyp.findings_unexplained.length === 0) && (
                              <li className="text-gray-400 italic">None listed</li>
                            )}
                          </ul>
                        </div>
                      </div>
                      {hyp.features && Object.keys(hyp.features).length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-700 mb-2">Features</h4>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(hyp.features).map(([key, value]) => (
                              <span key={key} className="px-2 py-1 bg-gray-200 rounded text-xs">
                                {key}: {String(value)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function VisualizationsTab({ differential, similarDiagnoses, geometry }) {
  return (
    <div className="space-y-8">
      {/* Score Distribution Chart */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Score Distribution</h3>
        <ScoreDistributionChart differential={differential.slice(0, 10)} />
      </div>

      {/* Feature Matrix Heatmap */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Feature Matrix</h3>
        <FeatureMatrixHeatmap differential={differential.slice(0, 8)} />
      </div>

      {/* Hypothesis Similarity Network */}
      {similarDiagnoses && similarDiagnoses.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Diagnosis Similarity</h3>
          <SimilarityMatrix similarDiagnoses={similarDiagnoses} />
        </div>
      )}

      {/* Score Landscape */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Score Landscape</h3>
        <ScoreLandscape differential={differential} geometry={geometry} />
      </div>
    </div>
  );
}


function GeometryTab({ geometry, differential }) {
  const metrics = [
    { key: 'spectral_gap', label: 'Spectral Gap (Δ)', desc: 'Separation between top eigenvalues. Higher = clearer winner.' },
    { key: 'information_viscosity', label: 'Information Viscosity (λ)', desc: 'How "thick" the probability flows. Higher = more diffuse.' },
    { key: 'von_neumann_entropy', label: 'Von Neumann Entropy (S)', desc: 'Quantum entropy of the density matrix. Higher = more uncertainty.' },
    { key: 'mean_curvature', label: 'Mean Curvature (κ)', desc: 'Average curvature of hypothesis manifold. Indicates clustering.' },
    { key: 'diagnostic_action', label: 'Diagnostic Action', desc: 'Total "cost" of the diagnostic path through hypothesis space.' },
    { key: 'score_spread', label: 'Score Spread', desc: 'Range between highest and lowest scores.' },
    { key: 'top_gap', label: 'Top Gap', desc: 'Difference between #1 and #2 hypothesis scores.' },
    { key: 'feature_dimensions', label: 'Feature Dimensions', desc: 'Number of clinical features used in scoring.' },
  ];

  return (
    <div className="space-y-6">
      {/* Confidence Summary */}
      <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Diagnostic Confidence</h3>
            <p className="text-sm text-gray-600 mt-1">{geometry.interpretation}</p>
          </div>
          {geometry.confidence_score !== null && geometry.confidence_score !== undefined && (
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600">
                {(geometry.confidence_score * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-500 capitalize">{geometry.confidence_level} confidence</div>
            </div>
          )}
        </div>
        
        {/* Uncertainty bounds */}
        {geometry.uncertainty_lower !== null && geometry.uncertainty_upper !== null && (
          <div className="mt-4">
            <div className="text-sm text-gray-600 mb-1">Uncertainty Range</div>
            <div className="h-4 bg-gray-200 rounded-full relative">
              <div 
                className="absolute h-full bg-indigo-400 rounded-full opacity-50"
                style={{ 
                  left: `${geometry.uncertainty_lower * 100}%`, 
                  width: `${(geometry.uncertainty_upper - geometry.uncertainty_lower) * 100}%` 
                }}
              />
              {geometry.confidence_score && (
                <div 
                  className="absolute w-3 h-3 bg-indigo-600 rounded-full -top-0.5 transform -translate-x-1/2"
                  style={{ left: `${geometry.confidence_score * 100}%` }}
                />
              )}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{(geometry.uncertainty_lower * 100).toFixed(0)}%</span>
              <span>{(geometry.uncertainty_upper * 100).toFixed(0)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map(({ key, label, desc }) => {
          const value = geometry[key];
          if (value === null || value === undefined) return null;
          
          return (
            <div key={key} className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {typeof value === 'number' ? value.toFixed(4) : value}
              </div>
              <div className="text-sm font-medium text-gray-700 mt-1">{label}</div>
              <div className="text-xs text-gray-500 mt-1">{desc}</div>
            </div>
          );
        })}
      </div>

      {/* Spectral Geometry Visualization */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Spectral Decomposition</h3>
        <SpectralVisualization geometry={geometry} differential={differential} />
      </div>
    </div>
  );
}


function ReasoningTab({ reasoningChain }) {
  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-4">MCQ Reasoning Chain</h3>
      <div className="space-y-2 font-mono text-sm bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto max-h-96 overflow-y-auto">
        {reasoningChain.map((step, i) => (
          <div key={i} className="flex">
            <span className="text-gray-500 mr-3 select-none">{String(i + 1).padStart(3, '0')}</span>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


// =============================================================================
// VISUALIZATION COMPONENTS
// =============================================================================

function StatCard({ label, value, sublabel }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm font-medium text-gray-700">{label}</div>
      {sublabel && <div className="text-xs text-gray-500">{sublabel}</div>}
    </div>
  );
}

function ScoreBar({ score }) {
  const percentage = score * 100;
  return (
    <div className="flex items-center">
      <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
        <div 
          className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2 rounded-full transition-all" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-gray-600 w-14">{percentage.toFixed(1)}%</span>
    </div>
  );
}

function ScoreDistributionChart({ differential }) {
  const maxScore = Math.max(...differential.map(d => d.score));
  
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="space-y-3">
        {differential.map((hyp, i) => (
          <div key={i} className="flex items-center">
            <div className="w-32 text-sm text-gray-700 truncate pr-2" title={hyp.name}>
              {i + 1}. {hyp.name}
            </div>
            <div className="flex-1 h-8 bg-gray-200 rounded relative overflow-hidden">
              <div 
                className={`h-full rounded transition-all ${
                  i === 0 ? 'bg-gradient-to-r from-indigo-600 to-blue-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'
                }`}
                style={{ width: `${(hyp.score / maxScore) * 100}%` }}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-white drop-shadow">
                {(hyp.score * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureMatrixHeatmap({ differential }) {
  // Collect all unique features
  const allFeatures = new Set();
  differential.forEach(hyp => {
    if (hyp.features) {
      Object.keys(hyp.features).forEach(f => allFeatures.add(f));
    }
  });
  const features = Array.from(allFeatures).slice(0, 8); // Limit to 8 features
  
  if (features.length === 0) {
    return <div className="text-gray-500 italic">No feature data available</div>;
  }

  // Color scale function
  const getColor = (value) => {
    if (value === undefined || value === null || value === '' || value === 'unknown') {
      return 'bg-gray-100';
    }
    if (value === 'yes' || value === true || value === 'high') {
      return 'bg-green-500';
    }
    if (value === 'no' || value === false || value === 'low') {
      return 'bg-red-400';
    }
    if (value === 'moderate' || value === 'medium') {
      return 'bg-yellow-400';
    }
    return 'bg-blue-400';
  };

  return (
    <div className="overflow-x-auto">
      <table className="text-xs">
        <thead>
          <tr>
            <th className="p-2 text-left font-medium text-gray-700">Diagnosis</th>
            {features.map(f => (
              <th key={f} className="p-2 text-center font-medium text-gray-700 max-w-20">
                <div className="truncate transform -rotate-45 origin-left translate-y-4" title={f}>
                  {f}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {differential.map((hyp, i) => (
            <tr key={i}>
              <td className="p-2 font-medium text-gray-800 truncate max-w-32" title={hyp.name}>
                {hyp.name}
              </td>
              {features.map(f => {
                const value = hyp.features?.[f];
                return (
                  <td key={f} className="p-1">
                    <div 
                      className={`w-8 h-8 rounded ${getColor(value)} flex items-center justify-center`}
                      title={`${f}: ${value}`}
                    >
                      <span className="text-white text-xs font-bold">
                        {value === 'yes' ? '✓' : value === 'no' ? '✗' : ''}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-4 mt-4 text-xs text-gray-600">
        <span className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded mr-1"></div> Yes/High</span>
        <span className="flex items-center"><div className="w-3 h-3 bg-yellow-400 rounded mr-1"></div> Moderate</span>
        <span className="flex items-center"><div className="w-3 h-3 bg-red-400 rounded mr-1"></div> No/Low</span>
        <span className="flex items-center"><div className="w-3 h-3 bg-gray-100 rounded mr-1"></div> Unknown</span>
      </div>
    </div>
  );
}

function SimilarityMatrix({ similarDiagnoses }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="space-y-3">
        {similarDiagnoses.map((sim, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-800">{sim.diagnosis_a}</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="font-medium text-gray-800">{sim.diagnosis_b}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-indigo-600">κ = {sim.curvature?.toFixed(3)}</div>
              <div className="text-xs text-gray-500">W = {sim.wasserstein_distance?.toFixed(3)}</div>
            </div>
          </div>
        ))}
        {similarDiagnoses.length > 0 && similarDiagnoses[0].clinical_note && (
          <p className="text-sm text-gray-600 italic mt-2">
            ⚠️ {similarDiagnoses[0].clinical_note}
          </p>
        )}
      </div>
    </div>
  );
}

function ScoreLandscape({ differential, geometry }) {
  // Create a simple visualization of score distribution
  const scores = differential.map(d => d.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const range = maxScore - minScore || 0.01;
  
  return (
    <div className="p-4 bg-gray-900 rounded-lg">
      <div className="relative h-48">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(p => (
          <div 
            key={p} 
            className="absolute left-0 right-0 border-t border-gray-700"
            style={{ bottom: `${p * 100}%` }}
          >
            <span className="absolute -left-8 -top-2 text-xs text-gray-500">
              {(minScore + range * p).toFixed(2)}
            </span>
          </div>
        ))}
        
        {/* Score points */}
        {differential.slice(0, 15).map((hyp, i) => {
          const x = (i / Math.min(differential.length - 1, 14)) * 90 + 5;
          const y = ((hyp.score - minScore) / range) * 100;
          return (
            <div
              key={i}
              className={`absolute w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
                i === 0 ? 'bg-yellow-400 ring-2 ring-yellow-200' : 'bg-indigo-500'
              }`}
              style={{ left: `${x}%`, bottom: `${y}%` }}
              title={`${hyp.name}: ${(hyp.score * 100).toFixed(1)}%`}
            />
          );
        })}
        
        {/* Connect the dots */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <polyline
            fill="none"
            stroke="rgba(99, 102, 241, 0.5)"
            strokeWidth="2"
            points={differential.slice(0, 15).map((hyp, i) => {
              const x = (i / Math.min(differential.length - 1, 14)) * 90 + 5;
              const y = 100 - ((hyp.score - minScore) / range) * 100;
              return `${x}%,${y}%`;
            }).join(' ')}
          />
        </svg>
      </div>
      <div className="text-center text-xs text-gray-500 mt-2">
        Hypothesis rank (1 → {differential.length})
      </div>
    </div>
  );
}

function SpectralVisualization({ geometry, differential }) {
  // Visualize spectral gap and eigenvalue-like distribution
  const spectralGap = geometry.spectral_gap || 0;
  const normalizedGap = Math.min(spectralGap, 1);
  
  return (
    <div className="p-4 bg-gradient-to-br from-gray-900 to-indigo-900 rounded-lg text-white">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Spectral Gap Gauge */}
        <div className="text-center">
          <div className="relative w-40 h-40 mx-auto">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="12"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="url(#spectralGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${normalizedGap * 440} 440`}
              />
              <defs>
                <linearGradient id="spectralGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <div className="text-3xl font-bold">{spectralGap.toFixed(3)}</div>
              <div className="text-xs text-gray-400">Spectral Gap</div>
            </div>
          </div>
        </div>
        
        {/* Eigenvalue-like bars */}
        <div>
          <div className="text-sm text-gray-400 mb-2">Score Eigenspectrum</div>
          <div className="space-y-1">
            {differential.slice(0, 8).map((hyp, i) => (
              <div key={i} className="flex items-center">
                <span className="text-xs text-gray-500 w-6">λ{i+1}</span>
                <div className="flex-1 h-4 bg-gray-800 rounded overflow-hidden">
                  <div 
                    className={`h-full ${i === 0 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                    style={{ width: `${hyp.score * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-12 text-right">
                  {(hyp.score * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Additional metrics */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-700">
        <div className="text-center">
          <div className="text-xl font-bold text-indigo-400">
            {geometry.von_neumann_entropy?.toFixed(3) || '—'}
          </div>
          <div className="text-xs text-gray-500">Entropy</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-green-400">
            {geometry.mean_curvature?.toFixed(3) || '—'}
          </div>
          <div className="text-xs text-gray-500">Curvature</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-yellow-400">
            {geometry.information_viscosity?.toFixed(3) || '—'}
          </div>
          <div className="text-xs text-gray-500">Viscosity</div>
        </div>
      </div>
    </div>
  );
}
