import React, { useState, useEffect } from 'react';
import { Send, Loader2, AlertCircle, Info } from 'lucide-react';
import { analyzeProfessional, getTemplates } from '../api/client';
import ProfessionalResults from './ProfessionalResults';

const DEFAULT_ISBAR = {
  identification: {
    age: '',
    sex: '',
    chief_complaint: '',
  },
  situation: {
    presenting_problem: '',
    onset: '',
    severity: '',
    context: '',
  },
  background: {
    medical_history: '',
    medications: '',
    allergies: '',
    social_history: '',
  },
  assessment: {
    vital_signs: '',
    physical_exam: '',
    investigations: '',
    clinical_impression: '',
  },
  recommendation: {
    working_diagnosis: '',
    plan: '',
    urgency: 'routine',
  },
};

function ProfessionalMode() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('medical_isbar');
  const [formData, setFormData] = useState(DEFAULT_ISBAR);
  const [activeSection, setActiveSection] = useState('identification');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await getTemplates();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Convert form data to the expected format
      const input = {
        identification: {
          age: formData.identification.age ? parseInt(formData.identification.age) : null,
          sex: formData.identification.sex || null,
          chief_complaint: formData.identification.chief_complaint,
        },
        situation: {
          presenting_problem: formData.situation.presenting_problem,
          onset: formData.situation.onset || null,
          severity: formData.situation.severity || null,
          context: formData.situation.context || null,
        },
        background: {
          medical_history: formData.background.medical_history || null,
          medications: formData.background.medications || null,
          allergies: formData.background.allergies || null,
          social_history: formData.background.social_history || null,
        },
        assessment: {
          vital_signs: formData.assessment.vital_signs || null,
          physical_exam: formData.assessment.physical_exam || null,
          investigations: formData.assessment.investigations || null,
          clinical_impression: formData.assessment.clinical_impression || null,
        },
        recommendation: {
          working_diagnosis: formData.recommendation.working_diagnosis || null,
          plan: formData.recommendation.plan || null,
          urgency: formData.recommendation.urgency,
        },
      };

      const response = await analyzeProfessional(input, selectedTemplate);
      setResult(response);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startOver = () => {
    setResult(null);
    setError(null);
    setFormData(DEFAULT_ISBAR);
    setActiveSection('identification');
  };

  const isFormValid = () => {
    return (
      formData.identification.chief_complaint.trim() &&
      formData.situation.presenting_problem.trim()
    );
  };

  // Show results
  if (result) {
    return <ProfessionalResults result={result} onStartOver={startOver} />;
  }

  const sections = [
    { id: 'identification', label: 'I', title: 'Identification' },
    { id: 'situation', label: 'S', title: 'Situation' },
    { id: 'background', label: 'B', title: 'Background' },
    { id: 'assessment', label: 'A', title: 'Assessment' },
    { id: 'recommendation', label: 'R', title: 'Recommendation' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Professional ISBAR Analysis</h2>
        <p className="text-slate-600">
          Structured clinical reasoning using the ISBAR framework
        </p>
      </div>

      {/* ISBAR Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeSection === section.id
                ? 'bg-primary-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
              activeSection === section.id
                ? 'bg-white/20'
                : 'bg-slate-100'
            }`}>
              {section.label}
            </span>
            {section.title}
          </button>
        ))}
      </div>

      {/* Form Sections */}
      <div className="card mb-6">
        {/* Identification */}
        {activeSection === 'identification' && (
          <div className="card-body space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                I
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Identification</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Age</label>
                <input
                  type="number"
                  value={formData.identification.age}
                  onChange={(e) => handleInputChange('identification', 'age', e.target.value)}
                  placeholder="e.g., 45"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Sex</label>
                <select
                  value={formData.identification.sex}
                  onChange={(e) => handleInputChange('identification', 'sex', e.target.value)}
                  className="input"
                >
                  <option value="">Select...</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="label">Chief Complaint *</label>
              <input
                type="text"
                value={formData.identification.chief_complaint}
                onChange={(e) => handleInputChange('identification', 'chief_complaint', e.target.value)}
                placeholder="e.g., Chest pain, Shortness of breath"
                className="input"
              />
            </div>
          </div>
        )}

        {/* Situation */}
        {activeSection === 'situation' && (
          <div className="card-body space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                S
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Situation</h3>
            </div>
            
            <div>
              <label className="label">Presenting Problem *</label>
              <textarea
                value={formData.situation.presenting_problem}
                onChange={(e) => handleInputChange('situation', 'presenting_problem', e.target.value)}
                placeholder="Describe the current clinical situation..."
                className="input min-h-[100px] resize-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Onset</label>
                <input
                  type="text"
                  value={formData.situation.onset}
                  onChange={(e) => handleInputChange('situation', 'onset', e.target.value)}
                  placeholder="e.g., 2 hours ago, gradual over 3 days"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Severity</label>
                <input
                  type="text"
                  value={formData.situation.severity}
                  onChange={(e) => handleInputChange('situation', 'severity', e.target.value)}
                  placeholder="e.g., 7/10 pain, moderate distress"
                  className="input"
                />
              </div>
            </div>
            
            <div>
              <label className="label">Context</label>
              <textarea
                value={formData.situation.context}
                onChange={(e) => handleInputChange('situation', 'context', e.target.value)}
                placeholder="Precipitating factors, circumstances..."
                className="input min-h-[80px] resize-none"
              />
            </div>
          </div>
        )}

        {/* Background */}
        {activeSection === 'background' && (
          <div className="card-body space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                B
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Background</h3>
            </div>
            
            <div>
              <label className="label">Medical History</label>
              <textarea
                value={formData.background.medical_history}
                onChange={(e) => handleInputChange('background', 'medical_history', e.target.value)}
                placeholder="Past medical history, surgical history..."
                className="input min-h-[80px] resize-none"
              />
            </div>
            
            <div>
              <label className="label">Medications</label>
              <textarea
                value={formData.background.medications}
                onChange={(e) => handleInputChange('background', 'medications', e.target.value)}
                placeholder="Current medications and doses..."
                className="input min-h-[80px] resize-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Allergies</label>
                <input
                  type="text"
                  value={formData.background.allergies}
                  onChange={(e) => handleInputChange('background', 'allergies', e.target.value)}
                  placeholder="NKDA or list allergies"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Social History</label>
                <input
                  type="text"
                  value={formData.background.social_history}
                  onChange={(e) => handleInputChange('background', 'social_history', e.target.value)}
                  placeholder="Smoking, alcohol, occupation..."
                  className="input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Assessment */}
        {activeSection === 'assessment' && (
          <div className="card-body space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                A
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Assessment</h3>
            </div>
            
            <div>
              <label className="label">Vital Signs</label>
              <input
                type="text"
                value={formData.assessment.vital_signs}
                onChange={(e) => handleInputChange('assessment', 'vital_signs', e.target.value)}
                placeholder="BP, HR, RR, Temp, SpO2..."
                className="input"
              />
            </div>
            
            <div>
              <label className="label">Physical Examination</label>
              <textarea
                value={formData.assessment.physical_exam}
                onChange={(e) => handleInputChange('assessment', 'physical_exam', e.target.value)}
                placeholder="Relevant examination findings..."
                className="input min-h-[100px] resize-none"
              />
            </div>
            
            <div>
              <label className="label">Investigations</label>
              <textarea
                value={formData.assessment.investigations}
                onChange={(e) => handleInputChange('assessment', 'investigations', e.target.value)}
                placeholder="Lab results, imaging, ECG..."
                className="input min-h-[80px] resize-none"
              />
            </div>
            
            <div>
              <label className="label">Clinical Impression</label>
              <textarea
                value={formData.assessment.clinical_impression}
                onChange={(e) => handleInputChange('assessment', 'clinical_impression', e.target.value)}
                placeholder="Your assessment of the clinical picture..."
                className="input min-h-[80px] resize-none"
              />
            </div>
          </div>
        )}

        {/* Recommendation */}
        {activeSection === 'recommendation' && (
          <div className="card-body space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                R
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Recommendation</h3>
            </div>
            
            <div>
              <label className="label">Working Diagnosis</label>
              <input
                type="text"
                value={formData.recommendation.working_diagnosis}
                onChange={(e) => handleInputChange('recommendation', 'working_diagnosis', e.target.value)}
                placeholder="Your initial diagnostic impression..."
                className="input"
              />
            </div>
            
            <div>
              <label className="label">Plan</label>
              <textarea
                value={formData.recommendation.plan}
                onChange={(e) => handleInputChange('recommendation', 'plan', e.target.value)}
                placeholder="Proposed management plan..."
                className="input min-h-[100px] resize-none"
              />
            </div>
            
            <div>
              <label className="label">Urgency</label>
              <select
                value={formData.recommendation.urgency}
                onChange={(e) => handleInputChange('recommendation', 'urgency', e.target.value)}
                className="input"
              >
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="emergent">Emergent</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium">Required fields: Chief Complaint and Presenting Problem</p>
          <p className="mt-1">
            The more information you provide, the more accurate the differential diagnosis will be.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isLoading || !isFormValid()}
        className="btn btn-primary btn-lg w-full flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating Differential...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Generate Differential Diagnosis
          </>
        )}
      </button>
    </div>
  );
}

export default ProfessionalMode;
