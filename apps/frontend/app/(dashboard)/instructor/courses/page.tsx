'use client';

import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import api from '@/lib/api';
import { BookOpen, Plus, Trash2, ChevronRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [creating, setCreating] = useState(false);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/courses?search=${search}`);
      setCourses(res.data.courses);
    } catch {
      setAlert({ type: 'error', message: 'Failed to load courses' });
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const createCourse = async () => {
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      await api.post('/courses', form);
      setAlert({ type: 'success', message: 'Course created!' });
      setShowModal(false);
      setForm({ title: '', description: '' });
      fetchCourses();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.error || 'Failed to create course' });
    } finally {
      setCreating(false);
    }
  };

  const deleteCourse = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await api.delete(`/courses/${id}`);
      setAlert({ type: 'success', message: 'Course deleted' });
      fetchCourses();
    } catch {
      setAlert({ type: 'error', message: 'Failed to delete course' });
    }
  };

  return (
    <DashboardLayout title="My Courses">
      <div className="space-y-4">
        {alert && <Alert type={alert.type} message={alert.message} />}

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 max-w-sm px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Course
          </Button>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No courses yet. Create your first course!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-md transition-shadow">
                <CardBody>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{course.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {course.description || 'No description'}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {course.modules?.length || 0} modules
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Link href={`/instructor/courses/${course.id}`} className="flex-1">
                      <Button size="sm" variant="secondary" className="w-full">
                        <ChevronRight className="w-4 h-4 mr-1" /> Manage
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => deleteCourse(course.id, course.title)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {/* Create Course Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h2 className="text-lg font-semibold mb-4">Create New Course</h2>
              <div className="space-y-3">
                <Input
                  label="Course Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Private Pilot Ground School"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Course description..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" isLoading={creating} onClick={createCourse}>
                  Create Course
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}