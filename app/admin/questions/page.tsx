import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getPrismaClient } from '@/lib/prisma';
import DashboardNav from '@/components/DashboardNav';
import AdminSidebar from '@/components/AdminSidebar';
import AdminQuestionsClient from './AdminQuestionsClient';

export default async function AdminQuestionsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const prisma = await getPrismaClient();
  const questions = await prisma.question.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          answers: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <DashboardNav />
      <AdminSidebar />
      
      <div className="ml-64 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">All Questions</h1>
          <p className="text-gray-600 text-lg">Monitor and manage all questions from students</p>
        </div>

        <AdminQuestionsClient questions={questions} />
      </div>
    </div>
  );
}

