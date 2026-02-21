'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import api from '@/lib/api';
import { Plus, Trash2, BookOpen, FileText, HelpCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<any>(null);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState({ title: '' });
  const [lessonForm, setLessonForm] = useState({ title: '', type: 'TEXT', content: '' });

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/courses/${courseId}`);
      const courseData = res.data?.course ?? res.data;
      setCourse(courseData);
    } catch {
      setAlert({ type: 'error', message: 'Failed to load course' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourse(); }, [courseId]);

  const createModule = async () => {
    if (!moduleForm.title.trim()) return;
    try {
      await api.post(`/courses/${courseId}/modules`, moduleForm);
      setAlert({ type: 'success', message: 'Module created!' });
      setShowModuleModal(false);
      setModuleForm({ title: '' });
      fetchCourse();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.error || 'Failed' });
    }
  };

  const deleteModule = async (moduleId: string) => {
    if (!confirm('Delete this module and all its lessons?')) return;
    try {
      await api.delete(`/courses/${courseId}/modules/${moduleId}`);
      fetchCourse();
    } catch {
      setAlert({ type: 'error', message: 'Failed to delete module' });
    }
  };

  const createLesson = async (moduleId: string) => {
    if (!lessonForm.title.trim()) return;
    try {
      await api.post(`/courses/modules/${moduleId}/lessons`, lessonForm);
      setAlert({ type: 'success', message: 'Lesson created!' });
      setShowLessonModal(null);
      setLessonForm({ title: '', type: 'TEXT', content: '' });
      fetchCourse();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.error || 'Failed' });
    }
  };

  const deleteLesson = async (moduleId: string, lessonId: string) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      await api.delete(`/courses/modules/${moduleId}/lessons/${lessonId}`);
      fetchCourse();
    } catch {
      setAlert({ type: 'error', message: 'Failed to delete lesson' });
    }
  };

  if (loading) return (
    <DashboardLayout title="Course">
      <div className="flex items-center justify-center py-16 text-gray-400">Loading...</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title={course?.title || 'Course Detail'}>
      <div className="space-y-4">
        {alert && <Alert type={alert.type} message={alert.message} />}

        {/* Course Header */}
        <Card>
          <CardBody>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{course?.title}</h2>
                <p className="text-gray-500 mt-1">{course?.description || 'No description'}</p>
              </div>
              <Button onClick={() => setShowModuleModal(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add Module
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Modules */}
        {course?.modules?.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No modules yet. Add your first module!
          </div>
        ) : (
          course?.modules?.map((mod: any, idx: number) => (
            <Card key={mod.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h3 className="font-semibold text-gray-900">{mod.title}</h3>
                    <span className="text-xs text-gray-400">{mod.lessons?.length || 0} lessons</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setShowLessonModal(mod.id)}>
                      <Plus className="w-4 h-4 mr-1" /> Add Lesson
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => deleteModule(mod.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                {mod.lessons?.length === 0 ? (
                  <p className="text-sm text-gray-400 px-6 py-4">No lessons yet.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {mod.lessons?.map((lesson: any) => (
                      <div key={lesson.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          {lesson.type === 'TEXT' ? (
                            <FileText className="w-4 h-4 text-blue-500" />
                          ) : (
                            <HelpCircle className="w-4 h-4 text-purple-500" />
                          )}
                          <span className="text-sm font-medium text-gray-800">{lesson.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            lesson.type === 'QUIZ'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {lesson.type}
                          </span>
                          {lesson.type === 'QUIZ' && !lesson.quiz && (
                            <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                              No quiz assigned
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {lesson.type === 'QUIZ' && (
                            <Link href={`/instructor/courses/${courseId}/lessons/${lesson.id}/quiz`}>
                              <Button size="sm" variant="secondary">
                                {lesson.quiz ? 'Edit Quiz' : 'Add Quiz'}
                              </Button>
                            </Link>
                          )}
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => deleteLesson(mod.id, lesson.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          ))
        )}

        {/* Add Module Modal */}
        {showModuleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Add Module</h2>
              <Input
                label="Module Title"
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ title: e.target.value })}
                placeholder="e.g. Introduction to Navigation"
              />
              <div className="flex gap-3 mt-4">
                <Button variant="secondary" className="flex-1" onClick={() => setShowModuleModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={createModule}>Create</Button>
              </div>
            </div>
          </div>
        )}

        {/* Add Lesson Modal */}
        {showLessonModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h2 className="text-lg font-semibold mb-4">Add Lesson</h2>
              <div className="space-y-3">
                <Input
                  label="Lesson Title"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  placeholder="e.g. Reading Aviation Charts"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['TEXT', 'QUIZ'].map((type) => (
                      <label key={type} className="cursor-pointer">
                        <input
                          type="radio"
                          value={type}
                          checked={lessonForm.type === type}
                          onChange={() => setLessonForm({ ...lessonForm, type })}
                          className="sr-only peer"
                        />
                        <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-xl text-sm font-medium transition-colors peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700 border-gray-200 text-gray-600">
                          {type === 'TEXT' ? <FileText className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
                          {type}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                {lessonForm.type === 'TEXT' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea
                      value={lessonForm.content}
                      onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                      rows={4}
                      placeholder="Lesson content..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-4">
                <Button variant="secondary" className="flex-1" onClick={() => setShowLessonModal(null)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={() => createLesson(showLessonModal)}>
                  Create Lesson
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}