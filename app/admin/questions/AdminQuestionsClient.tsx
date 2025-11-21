'use client';

import { useState } from 'react';
import Image from 'next/image';
import QuestionModal from '@/components/QuestionModal';
import axios from 'axios';

interface Answer {
  id: string;
  description: string;
  images: string[];
  userId: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface Question {
  id: string;
  title: string;
  type: string;
  description: string;
  images: string[];
  userId: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  _count?: {
    answers: number;
  };
}

interface AdminQuestionsClientProps {
  questions: Question[];
}

export default function AdminQuestionsClient({ questions }: AdminQuestionsClientProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [answersExpandedIds, setAnswersExpandedIds] = useState<Set<string>>(new Set());
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, Answer[]>>({});
  const [loadingAnswers, setLoadingAnswers] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const toggleAnswersExpand = async (questionId: string) => {
    const newExpanded = new Set(answersExpandedIds);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
      // Fetch answers if not already loaded
      if (!questionAnswers[questionId]) {
        setLoadingAnswers(prev => ({ ...prev, [questionId]: true }));
        try {
          const { data } = await axios.get(`/api/questions/${questionId}/answers`);
          setQuestionAnswers(prev => ({ ...prev, [questionId]: data.answers || [] }));
        } catch (error) {
          console.error('Failed to load answers:', error);
        } finally {
          setLoadingAnswers(prev => ({ ...prev, [questionId]: false }));
        }
      }
    }
    setAnswersExpandedIds(newExpanded);
  };

  const handleQuestionClick = (question: Question) => {
    setSelectedQuestion({
      ...question,
      createdAt: question.createdAt instanceof Date ? question.createdAt.toISOString() : question.createdAt,
    } as any);
    setIsModalOpen(true);
  };

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No questions yet</h3>
        <p className="text-gray-600">Students haven't posted any questions</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {questions.map((question) => {
          const isExpanded = expandedIds.has(question.id);
          const isAnswersExpanded = answersExpandedIds.has(question.id);
          const createdAt = question.createdAt instanceof Date 
            ? question.createdAt 
            : new Date(question.createdAt);

          return (
            <div
              key={question.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        {question.type}
                      </span>
                      <span className="text-sm text-gray-600">
                        {question.user.name || question.user.email}
                      </span>
                      <span className="text-xs text-gray-500">
                        {createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <h3 
                      className="font-semibold text-gray-900 mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => handleQuestionClick(question)}
                    >
                      {question.title}
                    </h3>
                    {isExpanded ? (
                      <div className="space-y-4">
                        <p className="text-gray-700 whitespace-pre-wrap text-sm">
                          {question.description}
                        </p>
                        {question.images.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {question.images.slice(0, 4).map((url, index) => (
                              <div
                                key={index}
                                className="relative aspect-square rounded-lg overflow-hidden border border-gray-200"
                              >
                                <Image
                                  src={url}
                                  alt={`Image ${index + 1}`}
                                  width={150}
                                  height={150}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                            {question.images.length > 4 && (
                              <div className="flex items-center justify-center aspect-square rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-600">
                                +{question.images.length - 4} more
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Answers Section */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <button
                            onClick={() => toggleAnswersExpand(question.id)}
                            className="flex items-center justify-between w-full mb-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <span className="font-semibold text-gray-900">
                              Answers ({questionAnswers[question.id]?.length ?? question._count?.answers ?? 0})
                            </span>
                            <svg
                              className={`w-5 h-5 transition-transform ${
                                isAnswersExpanded ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          {isAnswersExpanded && (
                            <div className="space-y-3">
                              {loadingAnswers[question.id] ? (
                                <div className="text-center text-gray-500 py-4">Loading answers...</div>
                              ) : questionAnswers[question.id]?.length === 0 ? (
                                <div className="text-center text-gray-500 py-4">No answers yet</div>
                              ) : (
                                questionAnswers[question.id]?.map((answer) => (
                                  <div
                                    key={answer.id}
                                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                                  >
                                    <div className="flex items-center gap-2 mb-3">
                                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 font-semibold text-sm">
                                          {(answer.user.name || answer.user.email.split('@')[0])[0].toUpperCase()}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          {answer.user.name || answer.user.email.split('@')[0]}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {new Date(answer.createdAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                    <p className="text-gray-700 whitespace-pre-wrap text-sm mb-3">
                                      {answer.description}
                                    </p>
                                    {answer.images.length > 0 && (
                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                                        {answer.images.map((url, index) => (
                                          <div
                                            key={index}
                                            className="relative aspect-video rounded-lg overflow-hidden border border-gray-200"
                                          >
                                            <Image
                                              src={url}
                                              alt={`Answer image ${index + 1}`}
                                              width={200}
                                              height={150}
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {question.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleExpand(question.id)}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    <svg
                      className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <QuestionModal
        question={selectedQuestion ? {
          ...selectedQuestion,
          createdAt: selectedQuestion.createdAt instanceof Date 
            ? selectedQuestion.createdAt.toISOString() 
            : selectedQuestion.createdAt,
        } as any : null}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedQuestion(null);
        }}
        canDelete={false}
      />
    </>
  );
}
