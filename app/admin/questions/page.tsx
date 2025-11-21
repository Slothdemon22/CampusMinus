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
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      <AdminSidebar />
      
      <div className="ml-64 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">All Questions</h1>
          <p className="text-gray-600">Monitor and manage all questions from students</p>
        </div>

        <AdminQuestionsClient questions={questions} />
      </div>
    </div>
  );
}

