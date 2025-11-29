'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import axios from 'axios';
import DashboardNav from '@/components/DashboardNav';
import Image from 'next/image';
import QuestionModal from '@/components/QuestionModal';

interface Question {
  id: string;
  title: string;
  type: string;
  description: string;
  images: string[];
  userId: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export default function QuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchQuestions();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const { data } = await axios.get('/api/auth/me');
      if (data.user) {
        setCurrentUser(data.user.id);
      }
    } catch (error) {
      // Not logged in, that's okay - questions are public
      setCurrentUser(null);
    }
  };

  const fetchQuestions = async () => {
    try {
      const { data } = await axios.get('/api/questions');
      setQuestions(data.questions || []);
    } catch (error: any) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchQuestions();
      return;
    }

    setIsSearching(true);
    try {
      const { data } = await axios.post('/api/questions/search', {
        query: searchQuery.trim(),
        limit: 3,
      });
      setQuestions(data.questions || []);
      if (data.questions && data.questions.length > 0) {
        toast.success(`Found ${data.questions.length} similar questions`);
      } else {
        toast.info('No similar questions found');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Search failed');
      fetchQuestions(); // Fallback to all questions
    } finally {
      setIsSearching(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <DashboardNav />
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-600">Loading questions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <DashboardNav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <div className="mb-6 sm:mb-8 md:mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 break-words">Community Questions</h1>
              <p className="text-sm sm:text-base md:text-lg text-gray-600">Browse questions from the community</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              {currentUser && (
                <>
                  <Link
                    href="/my-questions"
                    className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 text-gray-700 rounded-xl text-sm sm:text-base font-semibold hover:bg-gray-50 transition-all text-center"
                  >
                    My Questions
                  </Link>
                  <Link
                    href="/questions/new"
                    className="flex-1 sm:flex-none bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-center"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="hidden sm:inline">Ask Question</span>
                      <span className="sm:hidden">Ask</span>
                    </span>
                  </Link>
                </>
              )}
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="w-full flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search questions by description (semantic search)..."
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 placeholder:text-gray-400 bg-white"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  fetchQuestions();
                }}
                className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 md:p-16 text-center">
            <div className="text-gray-400 mb-6">
              <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No questions yet</h3>
            <p className="text-gray-600 mb-8 text-lg">Be the first to ask a question and help build our community</p>
            {currentUser && (
              <Link
                href="/questions/new"
                className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
              >
                Ask Your First Question
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {questions.map((question) => (
              <div
                key={question.id}
                onClick={() => {
                  setSelectedQuestion(question);
                  setIsModalOpen(true);
                }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Left Side - Content (50%) */}
                  <div className="w-full md:w-1/2 p-6 md:p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-sm font-semibold">
                          {question.type}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {question.user ? (question.user.name || question.user.email.split('@')[0]) : 'Deleted User'}
                        </span>
                      </div>
                    </div>
                    
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                      {question.title}
                    </h2>
                    
                    <div
                      className="text-gray-700 leading-relaxed mb-6 prose prose-sm max-w-none prose-p:text-gray-700 prose-strong:text-gray-900 line-clamp-5"
                      dangerouslySetInnerHTML={{ __html: question.description }}
                    />

                    <div className="flex items-center gap-2 text-sm text-gray-500 pt-4 border-t border-gray-100">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Posted {new Date(question.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                  </div>

                  {/* Right Side - Images (50%) */}
                  <div className="w-full md:w-1/2 p-6 md:p-8 bg-gray-50 border-t md:border-t-0 md:border-l border-gray-200">
                    {question.images.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {question.images.slice(0, 2).map((url, index) => (
                            <div 
                              key={index} 
                              className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors group cursor-pointer shadow-sm"
                            >
                              <Image
                                src={url}
                                alt={`Question image ${index + 1}`}
                                width={400}
                                height={400}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                            </div>
                          ))}
                        </div>
                        {question.images.length > 2 && (
                          <div className="mt-4 text-center">
                            <span className="text-sm text-gray-600 font-medium">
                              +{question.images.length - 2} more image{question.images.length - 2 > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full min-h-[200px] text-gray-400">
                        <div className="text-center">
                          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm">No images</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <QuestionModal
        question={selectedQuestion}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedQuestion(null);
        }}
        canDelete={false}
      />
    </div>
  );
}

