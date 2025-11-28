import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, AlertCircle, Info, Upload, FileText, X, FileUp, Clipboard } from 'lucide-react';
import { analyzeProfessional, getTemplates } from '../api/client';
import ProfessionalResults from './ProfessionalResults';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
  
  // File upload state
  const [inputMode, setInputMode] = useState('form'); // 'form' or 'upload' or 'paste'
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef(null);

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

  // Handle file selection
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/rtf'
    ];
    
    const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.rtf'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setError('Please upload a PDF, Word document (.docx), or text file (.txt)');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    setError(null);
    setIsExtracting(true);

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);

      // Send to backend for text extraction
      const response = await fetch(`${API_BASE_URL}/api/extract-text`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to extract text from file');
      }

      const data = await response.json();
      setExtractedText(data.text);
    } catch (err) {
      setError(err.message || 'Failed to process file');
      setUploadedFile(null);
    } finally {
      setIsExtracting(false);
    }
  };

  // Clear uploaded file
  const clearFile = () => {
    setUploadedFile(null);
    setExtractedText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let input;

      if (inputMode === 'form') {
        // Standard ISBAR form submission
        input = {
          age: formData.identification.age || '',
          sex: formData.identification.sex || '',
          chief_complaint: formData.identification.chief_complaint,
          symptoms: formData.situation.presenting_problem,
          onset: formData.situation.onset || null,
          severity: formData.situation.severity ? parseInt(formData.situation.severity) : null,
          duration: formData.situation.context || null,
          medical_history: formData.background.medical_history || null,
          medications: formData.background.medications || null,
          allergies: formData.background.allergies || null,
          social_history: formData.background.social_history || null,
          vital_signs: formData.assessment.vital_signs || null,
          physical_exam: formData.assessment.physical_exam || null,
          investigations: formData.assessment.investigations || null,
          clinical_question: formData.recommendation.working_diagnosis || null,
        };
      } else if (inputMode === 'upload') {
        // File upload - send extracted text as clinical note
        input = {
          clinical_note: extractedText,
          source: 'uploaded_file',
          filename: uploadedFile?.name || 'unknown',
        };
      } else {
        // Pasted text
        input = {
          clinical_note: pastedText,
          source: 'pasted_text',
        };
      }

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
    setUploadedFile(null);
    setExtractedText('');
    setPastedText('');
  };

  const isFormValid = () => {
    if (inputMode === 'form') {
      return (
        formData.identification.age.trim() &&
        formData.identification.sex.trim() &&
        formData.identification.chief_complaint.trim() &&
        formData.situation.presenting_problem.trim()
      );
    } else if (inputMode === 'upload') {
      return extractedText.trim().length > 50;
    } else {
      return pastedText.trim().length > 50;
    }
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
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Professional Clinical Analysis</h2>
        <p className="text-slate-600">
          Enter clinical information manually, upload a clinical note, or paste text
        </p>
      </div>

      {/* Input Mode Selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setInputMode('form')}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all flex-1 ${
            inputMode === 'form'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-5 h-5" />
          ISBAR Form
        </button>
        <button
          onClick={() => setInputMode('upload')}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all flex-1 ${
            inputMode === 'upload'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Upload className="w-5 h-5" />
          Upload Note
        </button>
        <button
          onClick={() => setInputMode('paste')}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all flex-1 ${
            inputMode === 'paste'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clipboard className="w-5 h-5" />
          Paste Text
        </button>
      </div>

      {/* Upload Mode */}
      {inputMode === 'upload' && (
        <div className="card mb-6">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Upload Clinical Note</h3>
            
            {!uploadedFile ? (
              <div 
                className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-primary-400 hover:bg-primary-50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.rtf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <FileUp className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-slate-500">
                  PDF, Word (.docx), or Text files up to 10MB
                </p>
              </div>
            ) : (
              <div>
                {/* File info */}
                <div className="flex items-center justify-between bg-slate-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary-600" />
                    <div>
                      <p className="font-medium text-slate-900">{uploadedFile.name}</p>
                      <p className="text-sm text-slate-500">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={clearFile}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {/* Extraction status */}
                {isExtracting ? (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Extracting text from document...
                  </div>
                ) : extractedText ? (
                  <div>
                    <label className="label">Extracted Clinical Note</label>
                    <textarea
                      value={extractedText}
                      onChange={(e) => setExtractedText(e.target.value)}
                      className="input min-h-[300px] font-mono text-sm resize-y"
                      placeholder="Extracted text will appear here..."
                    />
                    <p className="text-sm text-slate-500 mt-2">
                      {extractedText.length} characters extracted. You can edit the text before analysis.
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paste Mode */}
      {inputMode === 'paste' && (
        <div className="card mb-6">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Paste Clinical Note</h3>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="input min-h-[300px] font-mono text-sm resize-y"
              placeholder="Paste your clinical note here...

Example:
78 year old female presents with confusion and drowsiness for the past 2 days. 
PMH: Atrial fibrillation, Type 2 diabetes, Hypertension.
Medications: Metformin 1g BD, Apixaban 5mg BD, Lisinopril 10mg daily.
She reported burning with urination 3 days ago.
Vitals: T 38.4°C, BP 98/62, HR 112, RR 22, SpO2 94% RA.
Examination: Confused, suprapubic tenderness.
Labs: WBC 18.2, Creatinine 180 (baseline 95), Lactate 3.2."
            />
            <p className="text-sm text-slate-500 mt-2">
              {pastedText.length} characters. Include as much clinical detail as possible.
            </p>
          </div>
        </div>
      )}

      {/* ISBAR Form Mode */}
      {inputMode === 'form' && (
        <>
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
                    <label className="label">Age *</label>
                    <input
                      type="number"
                      value={formData.identification.age}
                      onChange={(e) => handleInputChange('identification', 'age', e.target.value)}
                      placeholder="e.g., 45"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Sex *</label>
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
                    placeholder="Describe the main symptoms and concerns..."
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
        </>
      )}

      {/* Info Box */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          {inputMode === 'form' ? (
            <>
              <p className="font-medium">Required fields: Age, Sex, Chief Complaint, and Presenting Problem</p>
              <p className="mt-1">
                The more information you provide, the more accurate the differential diagnosis will be.
              </p>
            </>
          ) : (
            <>
              <p className="font-medium">
                {inputMode === 'upload' ? 'Upload a clinical note' : 'Paste clinical text'}
              </p>
              <p className="mt-1">
                Include patient demographics, symptoms, history, vitals, examination findings, and any investigations.
                The system will extract relevant clinical information automatically.
              </p>
            </>
          )}
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
        disabled={isLoading || !isFormValid() || (inputMode === 'upload' && isExtracting)}
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
