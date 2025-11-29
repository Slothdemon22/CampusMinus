'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardNav from '@/components/DashboardNav';
import RichTextEditor from '@/components/RichTextEditor';
import { toast } from 'sonner';
import axios from 'axios';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  shareToken?: string | null;
  isPublic?: boolean;
}

const getPlainText = (html: string) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [shareUrls, setShareUrls] = useState<Record<string, string>>({});
  const [sharingNoteId, setSharingNoteId] = useState<string | null>(null);

  // Fetch notes from API
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/notes');
      setNotes(data.notes || []);
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Please login to view your notes');
      } else {
        toast.error('Failed to load notes');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAiNote = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please describe what you want the AI to generate');
      return;
    }

    setAiLoading(true);
    try {
      const { data } = await axios.post('/api/ai/notes', {
        prompt: aiPrompt.trim(),
        subject: title.trim() || undefined,
      });

      if (!data?.content) {
        throw new Error('Empty AI response');
      }

      // Set content and clear prompt
      setContent(data.content);
      setAiPrompt('');
      toast.success('AI note generated successfully!');
      setShowAiPanel(false);
    } catch (error: any) {
      console.error('AI notes error', error);
      toast.error(error?.response?.data?.error || 'Failed to generate notes');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!title.trim()) {
      toast.error('Please provide a note title');
      return;
    }

    if (!getPlainText(content)) {
      toast.error('Please add some content to your note');
      return;
    }

    setSaving(true);
    try {
      const { data } = await axios.post('/api/notes', {
        title: title.trim(),
        content,
      });

      // Note is already logged in the API route
      setNotes((prev) => [data.note, ...prev]);
      setTitle('');
      setContent('');
      toast.success('Note saved successfully');
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Please login to save notes');
      } else {
        toast.error(error.response?.data?.error || 'Failed to save note');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await axios.delete(`/api/notes/${id}`);
      setNotes((prev) => prev.filter((note) => note.id !== id));
      if (selectedNoteId === id) {
        setSelectedNoteId(null);
      }
      // Remove share URL if exists
      setShareUrls((prev) => {
        const newUrls = { ...prev };
        delete newUrls[id];
        return newUrls;
      });
      toast.success('Note deleted');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete note');
    }
  };

  const handleShareNote = async (id: string) => {
    setSharingNoteId(id);
    try {
      const { data } = await axios.post(`/api/notes/${id}/share`);
      const shareUrl = data.shareUrl;
      setShareUrls((prev) => ({ ...prev, [id]: shareUrl }));
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
      
      // Update note in list
      setNotes((prev) =>
        prev.map((note) =>
          note.id === id
            ? { ...note, shareToken: data.shareToken, isPublic: true }
            : note
        )
      );
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to share note');
    } finally {
      setSharingNoteId(null);
    }
  };

  const handleStopSharing = async (id: string) => {
    try {
      await axios.delete(`/api/notes/${id}/share`);
      setShareUrls((prev) => {
        const newUrls = { ...prev };
        delete newUrls[id];
        return newUrls;
      });
      
      // Update note in list
      setNotes((prev) =>
        prev.map((note) =>
          note.id === id
            ? { ...note, shareToken: null, isPublic: false }
            : note
        )
      );
      
      toast.success('Sharing disabled');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to stop sharing');
    }
  };

  const formattedNotes = useMemo(
    () =>
      notes.map((note) => ({
        ...note,
        createdDate: new Date(note.createdAt).toLocaleString(),
      })),
    [notes]
  );

  return (
    <div className="min-h-screen bg-white relative">
      <div className="relative z-10">
        <DashboardNav />

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 relative">
        {/* Header Section */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between mb-8 lg:mb-12">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-full mb-4">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Quick Notes</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-gray-900 mb-3 leading-tight">
              Personal Notes
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Workspace
              </span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
              Capture study ideas, reminders, and insights. Your notes are synced across all your devices.
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-5 sm:p-6 lg:p-8 text-center w-full sm:w-auto sm:min-w-[200px] lg:min-w-[240px]">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Notes</p>
            <p className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
              {notes.length}
            </p>
            <p className="text-xs text-gray-500">Synced & secure</p>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:gap-8">
          {/* Composer - full width */}
          <div>
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 p-6 sm:p-8 lg:p-10 transition-all hover:shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Create a New Note</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Organic Chemistry summary, Calculus formulas..."
                    className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 placeholder:text-gray-400 bg-gray-50/50 transition-all hover:border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <RichTextEditor
                    content={content}
                    onChange={setContent}
                    placeholder="Write your note with full formatting..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setTitle('');
                      setContent('');
                    }}
                    className="px-5 py-2.5 border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    disabled={saving}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      'Save Note'
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Notes are stored securely in the database and synced across all your devices.
                </p>
              </div>
            </div>
          </div>

          {/* Notes List - full width below editor */}
          <div className="space-y-4 sm:space-y-5">
            {loading ? (
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl border-2 border-dashed border-gray-300 px-8 py-16 sm:py-20 text-center min-h-[50vh] flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
                <p className="text-lg font-medium text-gray-600">Loading your notes...</p>
              </div>
            ) : formattedNotes.length === 0 ? (
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl border-2 border-dashed border-gray-300 px-6 sm:px-12 py-16 sm:py-20 text-center min-h-[50vh] flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No notes yet</h3>
                <p className="text-base text-gray-600 max-w-md">
                  Start by creating your first note above. It will appear here with all your other notes.
                </p>
              </div>
            ) : (
              formattedNotes.map((note) => {
                const isExpanded = selectedNoteId === note.id;
                return (
                  <div
                    key={note.id}
                    className="group bg-white/90 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="p-6 sm:p-8">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 break-words">{note.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Created {note.createdDate}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap justify-end">
                          {shareUrls[note.id] || note.isPublic ? (
                            <div className="flex items-center gap-2">
                              <div className="px-3 py-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                Shared
                              </div>
                              <button
                                onClick={() => {
                                  const url = shareUrls[note.id] || `${window.location.origin}/notes/shared/${note.shareToken}`;
                                  navigator.clipboard.writeText(url);
                                  toast.success('Link copied!');
                                }}
                                className="px-3 py-2 text-xs font-semibold text-blue-600 border-2 border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all"
                                title="Copy share link"
                              >
                                Copy Link
                              </button>
                              <button
                                onClick={() => handleStopSharing(note.id)}
                                className="px-3 py-2 text-xs font-semibold text-gray-600 border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
                                title="Stop sharing"
                              >
                                Stop Sharing
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleShareNote(note.id)}
                              disabled={sharingNoteId === note.id}
                              className="px-4 py-2 text-sm font-semibold text-purple-600 border-2 border-purple-200 rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {sharingNoteId === note.id ? (
                                <>
                                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  Sharing...
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                  </svg>
                                  Share
                                </>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="px-4 py-2 text-sm font-semibold text-red-600 border-2 border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all transform hover:scale-105 active:scale-95"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setSelectedNoteId(isExpanded ? null : note.id)}
                            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95"
                          >
                            {isExpanded ? 'Hide' : 'View'}
                          </button>
                        </div>
                      </div>

                      <div className="mt-6">
                        <div
                          className={`prose prose-sm sm:prose-base max-w-none text-gray-700 prose-p:text-gray-700 prose-strong:text-gray-900 prose-headings:text-gray-900 transition-all duration-300 ${
                            isExpanded ? '' : 'line-clamp-4'
                          }`}
                          dangerouslySetInnerHTML={{ __html: note.content }}
                        />
                        {!isExpanded && (
                          <button
                            onClick={() => setSelectedNoteId(note.id)}
                            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors group"
                          >
                            <span>Continue reading</span>
                            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Floating AI Notes Button + Panel */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => setShowAiPanel((prev) => !prev)}
          className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-sm font-bold hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 active:scale-95 backdrop-blur-sm"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-white/20 border border-white/30 text-xs font-extrabold backdrop-blur-sm">
            AI
          </span>
          <span className="hidden sm:inline">Generate notes</span>
        </button>

        {/* Slide-up Panel */}
        {showAiPanel && (
          <div className="mt-4 w-[calc(100vw-2rem)] sm:w-96 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border-2 border-gray-200/50 p-5 sm:p-6 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900">AI Note Generator</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAiPanel(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Describe what you want (topic, level, style). AI will generate formatted notes and replace the current content.
            </p>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={4}
              className="w-full text-sm px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 placeholder:text-gray-400 resize-none mb-4 bg-gray-50/50 transition-all hover:border-gray-300"
              placeholder="e.g. Short revision notes for Quantum Physics basics, Calculus formulas summary..."
            />
            <button
              type="button"
              onClick={handleGenerateAiNote}
              disabled={aiLoading || !aiPrompt.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {aiLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating…</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Generate notes</span>
                </>
              )}
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}


