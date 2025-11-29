import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * UnifiedMode - Single input interface for all users
 * 
 * Handles:
 * - Patient symptom descriptions in natural language
 * - Clinical notes (ISBAR, SOAP, free text)
 * - File uploads (PDF, DOCX, TXT)
 * - Voice input via Web Speech API
 * 
 * The backend auto-detects the input type and processes accordingly.
 */
export default function UnifiedMode({ onAnalyze, isLoading }) {
  const [inputText, setInputText] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false); // Ref to track listening state in callbacks

  // Keep ref in sync with state
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Initialize speech recognition once
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-AU'; // Australian English
      
      recognition.onresult = (event) => {
        console.log('Speech result received:', event.results);
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          console.log(`Result ${i}: "${transcript}", isFinal: ${event.results[i].isFinal}`);
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          console.log('Final transcript:', finalTranscript);
          setInputText(prev => {
            const separator = prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '';
            return prev + separator + finalTranscript;
          });
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          console.log('No speech detected, continuing to listen...');
        }
      };
      
      recognition.onend = () => {
        console.log('Recognition ended, isListening:', isListeningRef.current);
        // Restart if we're still supposed to be listening
        if (isListeningRef.current) {
          try {
            recognition.start();
            console.log('Restarted recognition');
          } catch (e) {
            console.error('Failed to restart:', e);
            setIsListening(false);
          }
        }
      };

      recognition.onstart = () => {
        console.log('Speech recognition started');
      };

      recognition.onaudiostart = () => {
        console.log('Audio capture started');
      };

      recognition.onspeechstart = () => {
        console.log('Speech detected');
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []); // Only run once on mount

  const toggleListening = useCallback(() => {
    if (!speechSupported || !recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Try Chrome or Edge.');
      return;
    }
    
    if (isListening) {
      console.log('Stopping speech recognition');
      isListeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        console.log('Starting speech recognition');
        isListeningRef.current = true;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
        // If already started, stop and restart
        if (e.message?.includes('already started')) {
          recognitionRef.current.stop();
          setTimeout(() => {
            recognitionRef.current.start();
            setIsListening(true);
          }, 100);
        }
      }
    }
  }, [isListening, speechSupported]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    setIsExtracting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to extract text from file');
      }

      const result = await response.json();
      if (result.success && result.text) {
        setExtractedText(result.text);
        setInputText(result.text);
      }
    } catch (error) {
      console.error('File extraction error:', error);
      alert('Could not extract text from file. Please paste the content manually.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Stop listening if active
    if (recognitionRef.current && isListeningRef.current) {
      isListeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    }
    
    if (!inputText.trim()) {
      alert('Please enter symptoms or clinical information');
      return;
    }

    // Build unified input object
    const analysisInput = {
      clinical_notes: inputText,
      chief_complaint: inputText.substring(0, 500),
      symptoms: inputText,
    };

    onAnalyze(analysisInput);
  };

  const handleClear = () => {
    setInputText('');
    setUploadedFile(null);
    setExtractedText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Stop listening if active
    if (recognitionRef.current && isListeningRef.current) {
      isListeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Input Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-t-xl">
            <h2 className="text-lg font-semibold text-white">
              Describe Symptoms or Paste Clinical Notes
            </h2>
            <p className="text-sm text-indigo-100 mt-1">
              Enter patient symptoms, or paste a clinical note (ISBAR, SOAP, MSE etc) for detailed analysis
            </p>
          </div>

          <div className="p-6">
            {/* File Upload and Voice Input */}
            <div className="mb-4">
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.txt,.rtf"
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Clinical Note
                </label>
                
                {/* Voice Input Button */}
                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-all ${
                      isListening 
                        ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100' 
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                  >
                    {isListening ? (
                      <>
                        <span className="relative flex h-5 w-5 mr-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <svg className="relative w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                          </svg>
                        </span>
                        Listening...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                        </svg>
                        Voice Input
                      </>
                    )}
                  </button>
                )}
                
                {uploadedFile && (
                  <span className="text-sm text-green-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {uploadedFile.name}
                  </span>
                )}
                {isExtracting && (
                  <span className="text-sm text-blue-600">Extracting text...</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">Supports PDF, Word (.docx), text files, and voice input (Chrome/Edge)</p>
            </div>

            {/* Main Text Area */}
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter symptoms or paste clinical notes here...

Examples:
• Patient description: 'I've had chest pain for 2 days, worse when breathing deeply, with a dry cough and mild fever.'

• Clinical note: 'SITUATION: 67F with acute onset dyspnea. BACKGROUND: COPD, ex-smoker. ASSESSMENT: SpO2 88% on RA, bilateral crackles...'"
              className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-gray-900 placeholder-gray-400"
              disabled={isLoading}
            />

            {/* Character count */}
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                {inputText.length} characters
              </span>
              {inputText.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Analyze with MCQ Oracle
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
