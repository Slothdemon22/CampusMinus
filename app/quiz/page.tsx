'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNav from '@/components/DashboardNav';
import { toast } from 'sonner';
import axios from 'axios';

const QUIZ_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Quantum Physics',
  'Engineering',
  'Statistics',
  'Calculus',
  'Algebra',
  'Geometry',
  'Trigonometry',
  'Organic Chemistry',
  'Inorganic Chemistry',
  'Physical Chemistry',
  'Mechanics',
  'Electromagnetism',
  'Thermodynamics',
  'Data Structures',
  'Algorithms',
  'Machine Learning',
  'Deep Learning',
  'Natural Language Processing (NLP)',
  'Artificial Intelligence',
  'Neural Networks',
  'Computer Vision',
  'Data Science',
  'Python Programming',
  'JavaScript',
  'Web Development',
  'Database Systems',
  'Operating Systems',
  'Computer Networks',
  'Cybersecurity',
  'Software Engineering',
  'General Knowledge',
  'Other',
];

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const QUESTION_COUNTS = [3, 5, 10, 15, 20];

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface Quiz {
  title: string;
  description: string;
  subject: string;
  questions: QuizQuestion[];
}

const QUIZ_STORAGE_KEY = 'ragra-quiz-state';

export default function QuizPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load quiz state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(QUIZ_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.quiz) {
          setQuiz(parsed.quiz);
          setSelectedAnswers(parsed.selectedAnswers || []);
          setShowResults(parsed.showResults || false);
          setPrompt(parsed.prompt || '');
          setSubject(parsed.subject || '');
          setDifficulty(parsed.difficulty || 'medium');
          setNumQuestions(parsed.numQuestions || 5);
        }
      }
    } catch (error) {
      console.error('Error loading quiz from localStorage:', error);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Save quiz state to localStorage whenever it changes
  useEffect(() => {
    if (!hydrated) return; // Don't save on initial mount
    
    try {
      const stateToSave = {
        quiz,
        selectedAnswers,
        showResults,
        prompt,
        subject,
        difficulty,
        numQuestions,
      };
      localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving quiz to localStorage:', error);
    }
  }, [quiz, selectedAnswers, showResults, prompt, subject, difficulty, numQuestions, hydrated]);

  const handleGenerateQuiz = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe what you want the quiz to cover');
      return;
    }

    if (!subject) {
      toast.error('Please select a subject');
      return;
    }

    setLoading(true);
    setQuiz(null);
    setSelectedAnswers([]);
    setShowResults(false);

    try {
      const { data } = await axios.post('/api/ai/quiz', {
        prompt: prompt.trim(),
        subject,
        difficulty,
        numQuestions,
      });

      if (!data?.quiz) {
        throw new Error('Empty quiz response');
      }

      const newAnswers = new Array(data.quiz.questions.length).fill(-1);
      setQuiz(data.quiz);
      setSelectedAnswers(newAnswers);
      
      // Save to localStorage immediately
      try {
        const stateToSave = {
          quiz: data.quiz,
          selectedAnswers: newAnswers,
          showResults: false,
          prompt: prompt.trim(),
          subject,
          difficulty,
          numQuestions,
        };
        localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(stateToSave));
      } catch (error) {
        console.error('Error saving new quiz to localStorage:', error);
      }
      
      toast.success('Quiz generated successfully!');
    } catch (error: any) {
      console.error('Quiz generation error', error);
      toast.error(error?.response?.data?.error || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    if (showResults) return;
    const newAnswers = [...selectedAnswers];
    newAnswers[questionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
    // Save to localStorage immediately
    try {
      const saved = localStorage.getItem(QUIZ_STORAGE_KEY);
      if (saved && quiz) {
        const parsed = JSON.parse(saved);
        parsed.selectedAnswers = newAnswers;
        localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (error) {
      console.error('Error saving answers to localStorage:', error);
    }
  };

  const handleSubmitQuiz = () => {
    if (selectedAnswers.some(answer => answer === -1)) {
      toast.error('Please answer all questions before submitting');
      return;
    }
    setShowResults(true);
    // Save to localStorage immediately
    try {
      const saved = localStorage.getItem(QUIZ_STORAGE_KEY);
      if (saved && quiz) {
        const parsed = JSON.parse(saved);
        parsed.showResults = true;
        localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (error) {
      console.error('Error saving results to localStorage:', error);
    }
  };

  const calculateScore = () => {
    if (!quiz) return 0;
    let correct = 0;
    quiz.questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const resetQuiz = () => {
    setQuiz(null);
    setPrompt('');
    setSubject('');
    setDifficulty('medium');
    setNumQuestions(5);
    setSelectedAnswers([]);
    setShowResults(false);
    // Clear localStorage
    try {
      localStorage.removeItem(QUIZ_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <DashboardNav />

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8 lg:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">AI Quiz Generator</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 leading-tight">
            Generate & Take AI-Powered Quizzes
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
            Create custom quizzes on any topic. AI generates questions tailored to your needs.
          </p>
        </div>

          {!quiz ? (
            <>
              {/* Quiz Generator Form */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 lg:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Create Your Quiz</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-5 py-3.5 pr-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 bg-gray-50/50 transition-all hover:border-gray-300 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M6%209L1%204h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_1rem_center] bg-no-repeat"
                  >
                    <option value="">Select a subject</option>
                    {QUIZ_SUBJECTS.map((subj) => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                    Topic Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    placeholder="e.g. Basic calculus derivatives, Quantum mechanics fundamentals, Organic chemistry reactions..."
                    className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 placeholder:text-gray-400 resize-none bg-gray-50/50 transition-all hover:border-gray-300"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                      Difficulty Level
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full px-5 py-3.5 pr-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 bg-gray-50/50 transition-all hover:border-gray-300 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M6%209L1%204h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_1rem_center] bg-no-repeat"
                    >
                      {DIFFICULTY_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                      Number of Questions
                    </label>
                    <select
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(Number(e.target.value))}
                      className="w-full px-5 py-3.5 pr-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 bg-gray-50/50 transition-all hover:border-gray-300 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M6%209L1%204h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_1rem_center] bg-no-repeat"
                    >
                      {QUESTION_COUNTS.map((count) => (
                        <option key={count} value={count}>
                          {count} Questions
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerateQuiz}
                  disabled={loading || !prompt.trim() || !subject}
                  className="w-full px-6 py-3.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Quiz...
                    </span>
                  ) : (
                    'Generate Quiz'
                  )}
                </button>
              </div>
            </div>
            </>
          ) : (
            <>
              {/* Quiz Display */}
              <div className="space-y-6">
              {/* Quiz Header */}
              <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-300 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 border border-blue-300 rounded-lg mb-3">
                      <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">{quiz.subject}</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">{quiz.title}</h2>
                    {quiz.description && (
                      <p className="text-base text-gray-700 leading-relaxed">{quiz.description}</p>
                    )}
                  </div>
                  {showResults && (
                    <div className="flex-shrink-0">
                      <div className="bg-blue-600 rounded-xl p-5 text-center text-white shadow-md">
                        <p className="text-xs font-bold uppercase tracking-wider mb-2">Score</p>
                        <p className="text-4xl font-extrabold mb-1">
                          {calculateScore()}/{quiz.questions.length}
                        </p>
                        <p className="text-base font-semibold">
                          {Math.round((calculateScore() / quiz.questions.length) * 100)}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {!showResults && (
                  <div className="flex items-center justify-between pt-4 border-t-2 border-gray-300">
                    <p className="text-sm font-medium text-gray-700">
                      {selectedAnswers.filter(a => a !== -1).length} of {quiz.questions.length} answered
                    </p>
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={selectedAnswers.some(answer => answer === -1)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Quiz
                    </button>
                  </div>
                )}
              </div>

              {/* Questions */}
              <div className="space-y-4">
                {quiz.questions.map((question, qIndex) => {
                  const isCorrect = selectedAnswers[qIndex] === question.correctAnswer;
                  const isSelected = selectedAnswers[qIndex] !== -1;

                  return (
                    <div
                      key={qIndex}
                      className={`bg-white rounded-xl border-2 p-6 sm:p-8 transition-all shadow-sm ${
                        showResults
                          ? isCorrect
                            ? 'border-green-400 bg-green-50'
                            : selectedAnswers[qIndex] !== question.correctAnswer && isSelected
                            ? 'border-red-400 bg-red-50'
                            : 'border-gray-300 bg-white'
                          : 'border-gray-300 hover:border-blue-400 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-5">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base ${
                          showResults
                            ? isCorrect
                              ? 'bg-green-600 text-white'
                              : 'bg-red-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}>
                          {qIndex + 1}
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex-1 leading-relaxed">
                          {question.question}
                        </h3>
                      </div>

                      <div className="ml-11 space-y-3">
                        {question.options.map((option, oIndex) => {
                          const isSelectedOption = selectedAnswers[qIndex] === oIndex;
                          const isCorrectOption = oIndex === question.correctAnswer;

                          return (
                            <button
                              key={oIndex}
                              onClick={() => handleAnswerSelect(qIndex, oIndex)}
                              disabled={showResults}
                              className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all font-medium ${
                                showResults
                                  ? isCorrectOption
                                    ? 'border-green-500 bg-green-100 text-green-900'
                                    : isSelectedOption && !isCorrectOption
                                    ? 'border-red-500 bg-red-100 text-red-900'
                                    : 'border-gray-300 bg-white text-gray-700'
                                  : isSelectedOption
                                  ? 'border-blue-500 bg-blue-100 text-blue-900 shadow-sm'
                                  : 'border-gray-300 bg-white text-gray-800 hover:border-blue-400 hover:bg-blue-50'
                              } ${showResults ? '' : 'cursor-pointer'}`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                                  showResults
                                    ? isCorrectOption
                                      ? 'bg-green-600 text-white'
                                      : isSelectedOption && !isCorrectOption
                                      ? 'bg-red-600 text-white'
                                      : 'bg-gray-300 text-gray-700'
                                    : isSelectedOption
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700'
                                }`}>
                                  {String.fromCharCode(65 + oIndex)}
                                </div>
                                <span className="flex-1 text-base font-medium">{option}</span>
                                {showResults && isCorrectOption && (
                                  <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {showResults && question.explanation && (
                        <div className={`mt-5 ml-14 p-5 rounded-xl border ${
                          isCorrect ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
                        }`}>
                          <p className="text-sm font-bold text-gray-900 mb-2">Explanation:</p>
                          <p className="text-sm text-gray-800 leading-relaxed">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={resetQuiz}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Create New Quiz
                </button>
                {showResults && (
                <button
                  onClick={() => {
                    setShowResults(false);
                    setSelectedAnswers(new Array(quiz.questions.length).fill(-1));
                  }}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all"
                >
                  Retake Quiz
                </button>
                )}
              </div>
            </div>
            </>
          )}
        </div>
      </div>
   
   )
  
}

