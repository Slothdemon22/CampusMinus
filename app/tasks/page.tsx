'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import axios from 'axios';
import DashboardNav from '@/components/DashboardNav';
import RichTextEditor from '@/components/RichTextEditor';
import CustomDatePicker from '@/components/DatePicker';

interface Task {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
}

type TabType = 'all' | 'overdue' | 'completed' | 'pending';

export default function TasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get('tab') as TabType) || 'all'
  );
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['all', 'overdue', 'completed', 'pending'].includes(tab)) {
      setActiveTab(tab as TabType);
    }
  }, [searchParams]);

  const fetchTasks = async () => {
    try {
      const { data } = await axios.get('/api/tasks');
      setTasks(data.tasks || []);
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.push('/login');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTask(null);
    setTitle('');
    setContent('');
    setDeadline('');
    setShowModal(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setContent(task.content);
    setDeadline(task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
      const payload = {
        title: title.trim(),
        content: content || '',
        deadline: deadline || null,
      };

      if (editingTask) {
        await axios.put(url, payload);
      } else {
        await axios.post(url, payload);
      }

      setShowModal(false);
      setEditingTask(null);
      setTitle('');
      setContent('');
      setDeadline('');
      fetchTasks();
      toast.success(editingTask ? 'Task updated successfully' : 'Task created successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    toast.promise(
      axios.delete(`/api/tasks/${id}`).then(() => fetchTasks()),
      {
        loading: 'Deleting task...',
        success: 'Task deleted successfully',
        error: 'Failed to delete task',
      }
    );
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      await axios.put(`/api/tasks/${task.id}`, { completed: !task.completed });
      fetchTasks();
      toast.success(task.completed ? 'Task marked as incomplete' : 'Task marked as complete');
    } catch (error: any) {
      toast.error('Failed to update task');
    }
  };

  const filterTasks = (tasks: Task[], tab: TabType): Task[] => {
    const now = new Date();
    
    switch (tab) {
      case 'completed':
        return tasks.filter(task => task.completed);
      case 'overdue':
        return tasks.filter(task => {
          if (task.completed || !task.deadline) return false;
          return new Date(task.deadline) < now;
        });
      case 'pending':
        return tasks.filter(task => {
          if (task.completed || !task.deadline) return false;
          return new Date(task.deadline) >= now;
        });
      case 'all':
      default:
        return tasks;
    }
  };

  const filteredTasks = filterTasks(tasks, activeTab);

  const getTabCount = (tab: TabType): number => {
    return filterTasks(tasks, tab).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">My Tasks</h1>
            <p className="text-gray-600 mt-2">Manage your to-do list and stay organized</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
          >
            + New Task
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'all' as TabType, label: 'All' },
              { id: 'pending' as TabType, label: 'Pending' },
              { id: 'overdue' as TabType, label: 'Overdue' },
              { id: 'completed' as TabType, label: 'Completed' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {getTabCount(tab.id)}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-600 mb-6">Create your first task to get started</p>
            <button
              onClick={handleCreate}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Create Task
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => {
              const deadlineDate = task.deadline ? new Date(task.deadline) : null;
              const isOverdue = deadlineDate && deadlineDate < new Date() && !task.completed;
              const isDueSoon = deadlineDate && deadlineDate > new Date() && deadlineDate.getTime() - new Date().getTime() < 24 * 60 * 60 * 1000 && !task.completed;

              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-lg transition-all flex flex-col h-full ${
                    task.completed ? 'opacity-75' : ''
                  } ${isOverdue ? 'border-red-300 bg-red-50/30' : ''} ${isDueSoon ? 'border-yellow-300 bg-yellow-50/30' : ''}`}
                >
                  {/* Header with checkbox and actions */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleComplete(task)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                      />
                      <h3
                        className={`text-lg font-semibold text-gray-900 truncate ${
                          task.completed ? 'line-through text-gray-500' : ''
                        }`}
                      >
                        {task.title}
                      </h3>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(task)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Content with overflow hidden */}
                  <div className="flex-1 min-h-0 mb-4">
                    <div
                      className="text-gray-700 text-sm prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:text-gray-700 line-clamp-4 overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: task.content }}
                    />
                  </div>

                  {/* Footer with dates */}
                  <div className="mt-auto pt-3 border-t border-gray-100 space-y-2">
                    {deadlineDate && (
                      <div className="flex items-center gap-2 text-xs">
                        <svg className={`w-4 h-4 flex-shrink-0 ${isOverdue ? 'text-red-500' : isDueSoon ? 'text-yellow-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className={`font-medium ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-yellow-600' : 'text-gray-600'}`}>
                          {isOverdue ? 'Overdue: ' : isDueSoon ? 'Due soon: ' : 'Deadline: '}
                          {deadlineDate.toLocaleDateString()} {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setShowModal(false);
                      setEditingTask(null);
                      setTitle('');
                      setContent('');
                      setDeadline('');
                    }
                  }}
          >
            {/* Subtle backdrop - no color change */}
            <div className="absolute inset-0 bg-black/5" />
            
            {/* Premium Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-100 transform transition-all">
              {/* Header with gradient accent */}
              <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-8 py-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {editingTask ? 'Edit Task' : 'Create New Task'}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {editingTask ? 'Update your task details' : 'Add a new task to your list'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingTask(null);
                      setTitle('');
                      setContent('');
                      setDeadline('');
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                    placeholder="Enter task title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Deadline (Optional)
                  </label>
                  <CustomDatePicker
                    value={deadline}
                    onChange={setDeadline}
                    placeholder="Select deadline date and time"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Content
                  </label>
                  <RichTextEditor
                    content={content}
                    onChange={setContent}
                    placeholder="Add task details, notes, or instructions..."
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingTask(null);
                    setTitle('');
                    setContent('');
                    setDeadline('');
                  }}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !title.trim()}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {saving ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

