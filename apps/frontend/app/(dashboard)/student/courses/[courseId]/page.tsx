'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { FileText, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

export default function StudentCourseDetailPage() {
    const { courseId } = useParams();
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [expandedModules, setExpandedModules] = useState<string[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get(`/courses/${courseId}`);

                // Backend sends { course: {...} }
                const courseData = res.data?.course ?? res.data;

                if (!courseData?.id) {
                    console.log('Invalid course data:', res.data);

                    return;
                }

                setCourse(courseData);

                const modules = Array.isArray(courseData.modules) ? courseData.modules : [];
                if (modules.length > 0) {
                    setExpandedModules([modules[0].id]);
                }
            } catch (err: any) {
                console.log('Error loading course:', err);

            } finally {
                setLoading(false);
            }
        };
        load();
    }, [courseId]);

    const toggleModule = (id: string) => {
        setExpandedModules((prev) =>
            prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
        );
    };

    if (loading) return (
        <DashboardLayout title="Course">
            <div className="text-center py-16 text-gray-400">Loading...</div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout title={course?.title || 'Course'}>
            <div className="space-y-4 max-w-3xl mx-auto">
                {/* Course Header */}
                <Card>
                    <CardBody>
                        <h2 className="text-xl font-bold text-gray-900">{course?.title}</h2>
                        <p className="text-gray-500 mt-1">{course?.description}</p>
                        <div className="flex gap-4 mt-3 text-sm text-gray-400">
                            <span>{course?.modules?.length} modules</span>
                            <span>
                                {course?.modules?.reduce(
                                    (acc: number, m: any) => acc + (m.lessons?.length || 0), 0
                                )} lessons
                            </span>
                        </div>
                    </CardBody>
                </Card>

                {/* Modules & Lessons */}
                {course?.modules?.map((mod: any, idx: number) => (
                    <Card key={mod.id}>
                        <button
                            onClick={() => toggleModule(mod.id)}
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                                    {idx + 1}
                                </span>
                                <span className="font-semibold text-gray-900">{mod.title}</span>
                                <span className="text-xs text-gray-400">{mod.lessons?.length} lessons</span>
                            </div>
                            {expandedModules.includes(mod.id)
                                ? <ChevronUp className="w-4 h-4 text-gray-400" />
                                : <ChevronDown className="w-4 h-4 text-gray-400" />
                            }
                        </button>

                        {expandedModules.includes(mod.id) && (
                            <div className="border-t border-gray-100 divide-y divide-gray-100">
                                {mod.lessons?.map((lesson: any) => (
                                    <div key={lesson.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            {lesson.type === 'TEXT'
                                                ? <FileText className="w-4 h-4 text-blue-500" />
                                                : <HelpCircle className="w-4 h-4 text-purple-500" />
                                            }
                                            <span className="text-sm text-gray-800">{lesson.title}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${lesson.type === 'QUIZ'
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {lesson.type}
                                            </span>
                                        </div>
                                        <Link href={`/student/courses/${courseId}/lessons/${lesson.id}`}>
                                            <Button size="sm" variant="secondary">
                                                {lesson.type === 'QUIZ' ? 'Take Quiz' : 'Read'}
                                            </Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </DashboardLayout>
    );
}