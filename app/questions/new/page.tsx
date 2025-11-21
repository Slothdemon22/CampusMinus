'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import axios from 'axios';
import DashboardNav from '@/components/DashboardNav';
import Image from 'next/image';

const QUESTION_TYPES = [
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
  'Other',
];

export default function NewQuestionPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setImageFiles([...imageFiles, ...newFiles]);

    // Create preview URLs
    const previewUrls = newFiles.map(file => URL.createObjectURL(file));
    setImages([...images, ...previewUrls]);
  };

  const handleImageUpload = async () => {
    if (imageFiles.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = imageFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const { data } = await axios.post('/api/questions/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      // Replace preview URLs with actual uploaded URLs
      setImages(uploadedUrls);
      toast.success('Images uploaded successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload images');
      // Remove failed uploads from preview
      setImageFiles([]);
      setImages([]);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !type.trim() || !description.trim()) {
      toast.error('Title, type, and description are required');
      return;
    }

    setSaving(true);
    try {
      // Upload images first if there are any
      let uploadedImageUrls: string[] = [];
      if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);

          const { data } = await axios.post('/api/questions/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          return data.url;
        });

        uploadedImageUrls = await Promise.all(uploadPromises);
      }

      await axios.post('/api/questions', {
        title: title.trim(),
        type: type.trim(),
        description: description.trim(),
        images: uploadedImageUrls,
      });

      toast.success('Question posted successfully');
      router.push('/questions');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to post question');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Post a Question</h1>
          <p className="text-gray-600 mt-2">Share your question with the community</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8 border border-gray-200 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
              placeholder="Enter question title"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Subject Type <span className="text-red-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 bg-white"
            >
              <option value="">Select a subject type</option>
              {QUESTION_TYPES.map((questionType) => (
                <option key={questionType} value={questionType}>
                  {questionType}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 resize-none"
              placeholder="Describe your question in detail..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Images (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                disabled={uploading}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className={`cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-600 font-medium">
                  {uploading ? 'Uploading...' : 'Click to select images'}
                </p>
                <p className="text-sm text-gray-500 mt-1">PNG, JPG, GIF up to 10MB each</p>
                {imageFiles.length > 0 && (
                  <p className="text-sm text-blue-600 mt-2 font-medium">
                    {imageFiles.length} image{imageFiles.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </label>
            </div>

            {images.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-3">
                  Preview ({images.length} image{images.length > 1 ? 's' : ''}):
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((url, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors">
                        <Image
                          src={url}
                          alt={`Preview ${index + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                          unoptimized={url.startsWith('blob:')}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-90 hover:opacity-100 transition-opacity shadow-lg"
                        title="Remove image"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {imageFiles[index] && (
                        <div className="absolute bottom-2 left-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded truncate">
                          {imageFiles[index].name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {saving ? 'Posting...' : 'Post Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

