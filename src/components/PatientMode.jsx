import React, { useState } from 'react';
import { Send, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import { analyzePatient } from '../api/client';
import PatientResults from './PatientResults';

const SYMPTOM_SUGGESTIONS = [
  'Headache',
  'Fatigue',
  'Nausea',
  'Dizziness',
  'Chest pain',
  'Shortness of breath',
  'Fever',
  'Cough',
  'Back pain',
  'Abdominal pain',
];

function PatientMode() {
  const [step, setStep] = useState(1); // 1: main concern, 2: details, 3: results
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  
  const [formData, setFormData] = useState({
    main_concern: '',
    age: '',
    sex: '',
    duration: '',
    severity: 5,
    other_symptoms: [],
    medical_history: '',
    medications: '',
    recent_changes: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleSymptom = (symptom) => {
    setFormData(prev => ({
      ...prev,
      other_symptoms: prev.other_symptoms.includes(symptom)
        ? prev.other_symptoms.filter(s => s !== symptom)
        : [...prev.other_symptoms, symptom]
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const input = {
        main_concern: formData.main_concern,
        age: formData.age ? parseInt(formData.age) : null,
        sex: formData.sex || null,
        duration: formData.duration || null,
        severity: formData.severity,
        other_symptoms: formData.other_symptoms,
        medical_history: formData.medical_history || null,
        medications: formData.medications || null,
        recent_changes: formData.recent_changes || null,
      };
      
      const response = await analyzePatient(input);
      setResult(response);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startOver = () => {
    setStep(1);
    setResult(null);
    setError(null);
    setFormData({
      main_concern: '',
      age: '',
      sex: '',
      duration: '',
      severity: 5,
      other_symptoms: [],
      medical_history: '',
      medications: '',
      recent_changes: '',
    });
  };

  // Step 3: Results
  if (step === 3 && result) {
    return <PatientResults result={result} onStartOver={startOver} />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
          step >= 1 ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-500'
        }`}>1</div>
        <div className={`flex-1 h-1 rounded ${step >= 2 ? 'bg-primary-600' : 'bg-slate-200'}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
          step >= 2 ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-500'
        }`}>2</div>
        <div className={`flex-1 h-1 rounded ${step >= 3 ? 'bg-primary-600' : 'bg-slate-200'}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
          step >= 3 ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-500'
        }`}>3</div>
      </div>

      {/* Step 1: Main Concern */}
      {step === 1 && (
        <div className="card">
          <div className="card-body">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              What's your main concern today?
            </h2>
            <p className="text-slate-600 mb-6">
              Describe what's bothering you in your own words.
            </p>
            
            <textarea
              name="main_concern"
              value={formData.main_concern}
              onChange={handleInputChange}
              placeholder="e.g., I've had a headache for 3 days and feel very tired..."
              className="input min-h-[120px] resize-none mb-6"
              autoFocus
            />
            
            <button
              onClick={() => setStep(2)}
              disabled={!formData.main_concern.trim()}
              className="btn btn-primary btn-lg w-full flex items-center justify-center gap-2"
            >
              Continue
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-900">A few more details</h3>
              <p className="text-sm text-slate-500">This helps improve the analysis (all optional)</p>
            </div>
            <div className="card-body space-y-6">
              {/* Age and Sex */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="e.g., 35"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Sex</label>
                  <select
                    name="sex"
                    value={formData.sex}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="">Select...</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              {/* Duration */}
              <div>
                <label className="label">How long have you had these symptoms?</label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="e.g., 3 days, 2 weeks, a few hours"
                  className="input"
                />
              </div>
              
              {/* Severity */}
              <div>
                <label className="label">
                  How severe? <span className="text-primary-600 font-bold">{formData.severity}/10</span>
                </label>
                <input
                  type="range"
                  name="severity"
                  min="1"
                  max="10"
                  value={formData.severity}
                  onChange={handleInputChange}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Mild</span>
                  <span>Severe</span>
                </div>
              </div>
              
              {/* Other Symptoms */}
              <div>
                <label className="label">Any other symptoms? (click to add)</label>
                <div className="flex flex-wrap gap-2">
                  {SYMPTOM_SUGGESTIONS.map(symptom => (
                    <button
                      key={symptom}
                      onClick={() => toggleSymptom(symptom)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        formData.other_symptoms.includes(symptom)
                          ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Context (collapsed by default) */}
          <details className="card">
            <summary className="card-header cursor-pointer hover:bg-slate-50">
              <span className="font-semibold text-slate-900">Additional context (optional)</span>
            </summary>
            <div className="card-body space-y-4">
              <div>
                <label className="label">Medical history</label>
                <textarea
                  name="medical_history"
                  value={formData.medical_history}
                  onChange={handleInputChange}
                  placeholder="Any relevant conditions, surgeries, etc."
                  className="input min-h-[80px] resize-none"
                />
              </div>
              <div>
                <label className="label">Current medications</label>
                <textarea
                  name="medications"
                  value={formData.medications}
                  onChange={handleInputChange}
                  placeholder="List any medications you're taking"
                  className="input min-h-[80px] resize-none"
                />
              </div>
              <div>
                <label className="label">Recent changes</label>
                <textarea
                  name="recent_changes"
                  value={formData.recent_changes}
                  onChange={handleInputChange}
                  placeholder="Stress, travel, diet changes, new activities, etc."
                  className="input min-h-[80px] resize-none"
                />
              </div>
            </div>
          </details>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="btn btn-secondary flex-1"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="btn btn-primary btn-lg flex-[2] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Analyze Symptoms
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientMode;
