/**
 * MCQ Oracle API Client
 */

const API_BASE = 'https://mcqoracle-production.up.railway.app';

/**
 * Analyze patient symptoms
 */
export async function analyzePatient(input) {
  const response = await fetch(`${API_BASE}/api/analyze/patient`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Analysis failed');
  }
  
  return response.json();
}

/**
 * Analyze professional ISBAR input
 */
export async function analyzeProfessional(input, templateId = 'medical_isbar') {
  const response = await fetch(`${API_BASE}/api/analyze/professional?template_id=${templateId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Analysis failed');
  }
  
  return response.json();
}

/**
 * Get available templates
 */
export async function getTemplates() {
  const response = await fetch(`${API_BASE}/api/templates`);
  
  if (!response.ok) {
    throw new Error('Failed to load templates');
  }
  
  return response.json();
}

/**
 * Health check
 */
export async function healthCheck() {
  const response = await fetch(`${API_BASE}/`);
  return response.json();
}
