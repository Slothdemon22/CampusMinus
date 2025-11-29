'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import axios from 'axios';
import RichTextEditor from './RichTextEditor';

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

interface QuestionModalProps {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

export default function QuestionModal({
  question,
  isOpen,
  onClose,
  onDelete,
  canDelete = false,
}: QuestionModalProps) {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [answerDescription, setAnswerDescription] = useState('');
  const [answerImages, setAnswerImages] = useState<string[]>([]);
  const [answerImageFiles, setAnswerImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingAnswerId, setDeletingAnswerId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (question) {
        fetchAnswers();
        fetchCurrentUser();
      }
    } else {
      document.body.style.overflow = 'unset';
      setShowAnswerForm(false);
      setAnswerDescription('');
      setAnswerImages([]);
      setAnswerImageFiles([]);
      setAnswers([]);
      setIsAdmin(false);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, question]);

  const fetchCurrentUser = async () => {
    try {
      const { data } = await axios.get('/api/auth/me');
      if (data.user && data.user.role === 'ADMIN') {
        setIsAdmin(true);
      }
    } catch (error) {
      // User not logged in or not admin
      setIsAdmin(false);
    }
  };

  const fetchAnswers = async () => {
    if (!question) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/questions/${question.id}/answers`);
      setAnswers(data.answers || []);
    } catch (error) {
      toast.error('Failed to load answers');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setAnswerImageFiles([...answerImageFiles, ...newFiles]);

    const previewUrls = newFiles.map(file => URL.createObjectURL(file));
    setAnswerImages([...answerImages, ...previewUrls]);
  };

  const removeAnswerImage = (index: number) => {
    setAnswerImages(answerImages.filter((_, i) => i !== index));
    setAnswerImageFiles(answerImageFiles.filter((_, i) => i !== index));
  };

  const handleDeleteAnswer = async (answerId: string) => {
    if (!confirm('Are you sure you want to delete this answer?')) {
      return;
    }

    setDeletingAnswerId(answerId);
    try {
      await axios.delete(`/api/answers/${answerId}`);
      toast.success('Answer deleted successfully');
      // Remove answer from local state
      setAnswers(answers.filter((a) => a.id !== answerId));
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete answer');
    } finally {
      setDeletingAnswerId(null);
    }
  };

  const getPlainText = (html: string) =>
    html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const handleSubmitAnswer = async () => {
    if (!question || !getPlainText(answerDescription)) {
      toast.error('Please provide an answer description');
      return;
    }

    setSubmitting(true);
    try {
      let uploadedUrls: string[] = [];
      if (answerImageFiles.length > 0) {
        const uploadPromises = answerImageFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);

          const { data } = await axios.post(
            `/api/questions/${question.id}/answers/upload`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );

          return data.url;
        });

        uploadedUrls = await Promise.all(uploadPromises);
      }

      await axios.post(`/api/questions/${question.id}/answers`, {
        description: answerDescription.trim(),
        images: uploadedUrls,
      });

      // Refetch answers to get the latest data
      await fetchAnswers();
      setShowAnswerForm(false);
      setAnswerDescription('');
      setAnswerImages([]);
      setAnswerImageFiles([]);
      toast.success('Answer posted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to post answer');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !question) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
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
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pr-8">
              {question.title}
            </h2>
          </div>
          <div className="flex gap-2">
            {canDelete && onDelete && (
              <button
                onClick={() => {
                  onDelete(question.id);
                  onClose();
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
            <div
              className="prose prose-blue max-w-none text-gray-700 leading-relaxed prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900"
              dangerouslySetInnerHTML={{ __html: question.description }}
            />
          </div>

          {question.images.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Images ({question.images.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {question.images.map((url, index) => (
                  <div
                    key={index}
                    className="relative aspect-video rounded-xl overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors group"
                  >
                    <Image
                      src={url}
                      alt={`Question image ${index + 1}`}
                      width={800}
                      height={600}
                      className="w-full h-full object-contain bg-gray-50"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                Posted {new Date(question.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Answers Section */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Answers ({answers.length})
            </h3>
            <button
              onClick={() => setShowAnswerForm(!showAnswerForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {showAnswerForm ? 'Cancel' : '+ Add Answer'}
            </button>
          </div>

          {/* Answer Form */}
          {showAnswerForm && (
            <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
              <div className="mb-4">
                <RichTextEditor
                  content={answerDescription}
                  onChange={setAnswerDescription}
                  placeholder="Write your answer..."
                />
              </div>
              
              <div className="mb-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAnswerImageSelect}
                  className="hidden"
                  id="answer-image-upload"
                />
                <label
                  htmlFor="answer-image-upload"
                  className="inline-block px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Add Images
                </label>
                {answerImages.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {answerImages.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={url}
                          alt={`Preview ${index + 1}`}
                          width={100}
                          height={100}
                          className="w-full h-full object-cover"
                          unoptimized={url.startsWith('blob:')}
                        />
                        <button
                          onClick={() => removeAnswerImage(index)}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleSubmitAnswer}
                disabled={submitting || uploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Posting...' : 'Post Answer'}
              </button>
            </div>
          )}

          {/* Answers List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center text-gray-500 py-4">Loading answers...</div>
            ) : answers.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>No answers yet. Be the first to answer!</p>
              </div>
            ) : (
              answers.map((answer) => (
                <div key={answer.id} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
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
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteAnswer(answer.id)}
                        disabled={deletingAnswerId === answer.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete answer"
                      >
                        {deletingAnswerId === answer.id ? (
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                  <div
                    className="text-gray-700 prose prose-sm max-w-none prose-p:text-gray-700 prose-strong:text-gray-900 mb-3"
                    dangerouslySetInnerHTML={{ __html: answer.description }}
                  />
                  {answer.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                      {answer.images.map((url, index) => (
                        <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
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
        </div>
      </div>
    </div>
  );
}

