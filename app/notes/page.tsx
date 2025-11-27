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
      toast.success('Note deleted');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete note');
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
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />

      <div className="w-full px-4 sm:px-6 lg:px-16 xl:px-24 py-8 md:py-12 relative">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Quick Notes</p>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mt-1">Personal Notes Workspace</h1>
            <p className="text-gray-600 mt-2 text-lg">
              Capture study ideas, reminders, and insights. Everything stays in your browser.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-6 text-center md:w-72">
            <p className="text-sm font-semibold text-gray-500">Notes created</p>
            <p className="text-4xl font-bold text-gray-900 mt-2">{notes.length}</p>
            <p className="text-xs text-gray-500 mt-1">Stored locally on this device</p>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* Composer - full width */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Create a note</h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Organic Chemistry summary"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Content</label>
                  <RichTextEditor
                    content={content}
                    onChange={setContent}
                    placeholder="Write your note with full formatting..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTitle('');
                      setContent('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Note'}
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Notes are stored in the database and synced across your devices.
              </p>
            </div>
          </div>

          {/* Notes List - full width below editor */}
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-300 px-8 py-12 text-center text-gray-500 min-h-[50vh] flex items-center justify-center">
                <p className="text-lg">Loading notes...</p>
              </div>
            ) : formattedNotes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-300 px-8 py-12 text-center text-gray-500 min-h-[50vh] flex items-center justify-center">
                <p className="text-lg max-w-xl">
                  No notes yet. Start by writing your first one on the left and it will appear here, filling your
                  notes space.
                </p>
              </div>
            ) : (
              formattedNotes.map((note) => {
                const isExpanded = selectedNoteId === note.id;
                return (
                  <div
                    key={note.id}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{note.title}</h3>
                          <p className="text-sm text-gray-500">Created {note.createdDate}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                    className="px-3 py-1.5 text-xs md:text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() =>
                              setSelectedNoteId(isExpanded ? null : note.id)
                            }
                            className="px-3 py-1.5 text-xs md:text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {isExpanded ? 'Hide' : 'View'}
                          </button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div
                          className={`prose prose-sm max-w-none text-gray-700 prose-p:text-gray-700 prose-strong:text-gray-900 transition-all ${
                            isExpanded ? '' : 'line-clamp-4'
                          }`}
                          dangerouslySetInnerHTML={{ __html: note.content }}
                        />
                        {!isExpanded && (
                          <div className="mt-2 text-sm text-blue-600 font-semibold cursor-pointer" onClick={() => setSelectedNoteId(note.id)}>
                            Continue reading →
                          </div>
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
      <div className="fixed bottom-6 right-6 z-40">
        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => setShowAiPanel((prev) => !prev)}
          className="flex items-center gap-2 px-4 py-3 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 border border-white/20 text-xs">
            AI
          </span>
          <span>Generate notes</span>
        </button>

        {/* Slide-up Panel */}
        {showAiPanel && (
          <div className="mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">Generate with AI</h3>
              <button
                type="button"
                onClick={() => setShowAiPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Describe what you want (topic, level, style). AI will replace the current content.
            </p>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 placeholder:text-gray-400 resize-none mb-3"
              placeholder="e.g. Short revision notes for Quantum Physics basics"
            />
            <button
              type="button"
              onClick={handleGenerateAiNote}
              disabled={aiLoading}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-md hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {aiLoading ? 'Generating…' : 'Generate notes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


