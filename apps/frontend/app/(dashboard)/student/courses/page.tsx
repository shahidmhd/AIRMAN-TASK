'use client';

import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardBody } from '@/components/ui/Card';
import api from '@/lib/api';
import Alert from '@/components/ui/Alert';
import { BookOpen, ChevronRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [alert, setAlert] = useState<any>(null);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/courses?search=${search}&limit=20`);
      setCourses(res.data.courses);
    } catch {
      setAlert({ type: 'error', message: 'Failed to load courses' });
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  return (
    <DashboardLayout title="Browse Courses">
      <div className="space-y-4">
        {alert && <Alert type={alert.type} message={alert.message} />}

        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading courses...
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No courses available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <Link key={course.id} href={`/student/courses/${course.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardBody>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">{course.title}</h3>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {course.description || 'No description'}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-gray-400">
                        {course.modules?.length || 0} modules •{' '}
                        {course.modules?.reduce(
                          (acc: number, m: any) => acc + (m.lessons?.length || 0), 0
                        )} lessons
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}