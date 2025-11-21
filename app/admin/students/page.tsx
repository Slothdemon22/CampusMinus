import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getPrismaClient } from '@/lib/prisma';
import DashboardNav from '@/components/DashboardNav';
import AdminSidebar from '@/components/AdminSidebar';

export default async function AdminStudentsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const prisma = await getPrismaClient();
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  const totalStudents = students.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      <AdminSidebar />
      
      <div className="ml-64 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Students</h1>
          <p className="text-gray-600">Manage and monitor all students</p>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalStudents}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">All Students</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Joined</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-gray-500">
                      No students registered yet
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 text-gray-900 font-medium">
                        {student.name || 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-gray-600">{student.email}</td>
                      <td className="py-4 px-6 text-gray-600">
                        {new Date(student.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

