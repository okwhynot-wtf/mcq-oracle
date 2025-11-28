/**
 * MCQ Oracle API Client
 * 
 * Supports both local Docker development and production deployment.
 * Uses relative URLs so the Vite proxy (dev) or reverse proxy (prod) handles routing.
 */

// Use relative URL - works with Vite proxy in dev and nginx/etc in prod
const API_BASE = '/api';

/**
 * Unified symptom analysis
 * Handles both patient descriptions and professional clinical notes
 */
export async function analyzeSymptoms(input, mode = 'professional') {
  // Build the request for the unified /api/analyze endpoint
  const request = {
    mode: mode,
    template_id: 'medical_isbar',
    raw_json: input,  // Send as raw JSON for maximum flexibility
    provider: 'openai'
  };

  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    let errorMessage = 'Analysis failed';
    try {
      const error = await response.json();
      errorMessage = error.detail || error.error || errorMessage;
    } catch {
      errorMessage = `Server error: ${response.status}`;
    }
    throw new Error(errorMessage);
  }
  
  return response.json();
}

/**
 * Analyze patient symptoms (legacy - redirects to unified)
 */
export async function analyzePatient(input) {
  // Convert patient input to unified format
  const unifiedInput = {
    chief_complaint: input.main_concern || '',
    symptoms: input.main_concern || '',
    age: input.age ? String(input.age) : '',
    sex: input.sex || '',
    medical_history: input.medical_history || '',
    medications: input.medications || '',
  };
  
  if (input.other_symptoms) {
    unifiedInput.symptoms += '\n' + input.other_symptoms.join('\n');
  }
  if (input.duration) {
    unifiedInput.duration = input.duration;
  }
  if (input.severity) {
    unifiedInput.severity = input.severity;
  }
  
  return analyzeSymptoms(unifiedInput, 'patient');
}

/**
 * Analyze professional ISBAR input (legacy - redirects to unified)
 */
export async function analyzeProfessional(input, templateId = 'medical_isbar') {
  return analyzeSymptoms(input, 'professional');
}

/**
 * Get available templates
 */
export async function getTemplates() {
  const response = await fetch(`${API_BASE}/templates`);
  
  if (!response.ok) {
    throw new Error('Failed to load templates');
  }
  
  return response.json();
}

/**
 * Extract text from uploaded file
 */
export async function extractTextFromFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/extract-text`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Text extraction failed');
  }
  
  return response.json();
}

/**
 * Generate PDF report
 */
export async function generateReport(professionalResult, patientSummary = null, reportId = null) {
  const response = await fetch(`${API_BASE}/report/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      professional_result: professionalResult,
      patient_summary: patientSummary,
      report_id: reportId
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Report generation failed');
  }
  
  return response.json();
}

/**
 * Health check
 */
export async function healthCheck() {
  const response = await fetch(`${API_BASE}/health`);
  return response.json();
}
