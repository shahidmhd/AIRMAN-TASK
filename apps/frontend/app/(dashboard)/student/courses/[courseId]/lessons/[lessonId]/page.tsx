'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import api from '@/lib/api';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

export default function LessonPage() {
  const { courseId, lessonId } = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const courseRes = await api.get(`/courses/${courseId}`);
        console.log('Course API response:', courseRes.data);

        // Handle both { course: {...} } and raw object
        const courseData = courseRes.data?.course ?? courseRes.data;
        console.log('Course data:', courseData);

        if (!courseData?.modules) {
          setAlert({ type: 'error', message: 'Course data invalid' });
          return;
        }

        // Find lesson across all modules
        let foundLesson = null;
        for (const mod of courseData.modules) {
          const l = mod.lessons?.find((l: any) => l.id === lessonId);
          if (l) { foundLesson = l; break; }
        }

        console.log('Found lesson:', foundLesson);

        if (!foundLesson) {
          setAlert({ type: 'error', message: 'Lesson not found in course' });
          return;
        }

        setLesson(foundLesson);

        // Load quiz if lesson is QUIZ type
        if (foundLesson.type === 'QUIZ' && foundLesson.quiz?.id) {
          const quizRes = await api.get(`/quizzes/${foundLesson.quiz.id}`);
          console.log('Quiz response:', quizRes.data);
          setQuiz(quizRes.data?.quiz ?? quizRes.data);
        }
      } catch (err: any) {
        console.error('Load error:', err);
        setAlert({
          type: 'error',
          message: err.response?.data?.error || 'Failed to load lesson',
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, lessonId]);

  const submitQuiz = async () => {
    if (!quiz) return;
    if (Object.keys(answers).length < quiz.questions.length) {
      setAlert({ type: 'error', message: 'Please answer all questions' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/quizzes/${quiz.id}/attempt`, { answers });
      setResult(res.data);
      setAlert(null);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.error || 'Failed to submit' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <DashboardLayout title="Lesson">
      <div className="flex items-center justify-center py-16 text-gray-400">
        Loading lesson...
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title={lesson?.title || 'Lesson'}>
      <div className="max-w-3xl mx-auto space-y-4">
        {alert && <Alert type={alert.type} message={alert.message} />}

        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Course
        </Button>

        {/* TEXT Lesson */}
        {lesson?.type === 'TEXT' && (
          <Card>
            <CardBody>
              <h2 className="text-xl font-bold text-gray-900 mb-4">{lesson.title}</h2>
              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {lesson.content || 'No content available for this lesson.'}
              </div>
            </CardBody>
          </Card>
        )}

        {/* QUIZ Lesson */}
        {lesson?.type === 'QUIZ' && (
          <>
            {!quiz ? (
              <Card>
                <CardBody className="text-center py-8 text-gray-400">
                  No quiz assigned to this lesson yet.
                </CardBody>
              </Card>
            ) : result ? (
              /* Results */
              <Card>
                <CardBody className="space-y-4">
                  <div className="text-center py-4">
                    <div className={`text-6xl font-bold mb-2 ${
                      result.percentage >= 70 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.percentage}%
                    </div>
                    <p className="text-gray-600 text-lg">
                      {result.score} / {result.total} correct
                    </p>
                    <p className={`text-xl font-semibold mt-2 ${
                      result.percentage >= 70 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.percentage >= 70 ? '🎉 Passed!' : '❌ Try Again'}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {result.results?.map((r: any, idx: number) => (
                      <div key={r.questionId} className={`p-4 rounded-xl border ${
                        r.isCorrect
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                      }`}>
                        <div className="flex items-start gap-2">
                          {r.isCorrect
                            ? <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                            : <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                          }
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              Q{idx + 1}: {r.questionText}
                            </p>
                            {!r.isCorrect && (
                              <>
                                <p className="text-sm text-red-600 mt-1">
                                  Your answer: {r.submitted || 'Not answered'}
                                </p>
                                <p className="text-sm text-green-700">
                                  Correct: {r.correctAnswer}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => { setResult(null); setAnswers({}); }}
                  >
                    Try Again
                  </Button>
                </CardBody>
              </Card>
            ) : (
              /* Quiz Questions */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">{lesson.title}</h2>
                  <span className="text-sm text-gray-500">
                    {Object.keys(answers).length}/{quiz.questions?.length} answered
                  </span>
                </div>

                {quiz.questions?.map((q: any, idx: number) => (
                  <Card key={q.id}>
                    <CardBody>
                      <p className="font-medium text-gray-900 mb-3">
                        Q{idx + 1}: {q.text}
                      </p>
                      <div className="space-y-2">
                        {(q.options as string[]).map((opt: string, oIdx: number) => (
                          <label
                            key={oIdx}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              answers[q.id] === opt
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              value={opt}
                              checked={answers[q.id] === opt}
                              onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                              className="sr-only"
                            />
                            <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                              answers[q.id] === opt
                                ? 'border-blue-500 bg-blue-500 text-white'
                                : 'border-gray-300 text-gray-500'
                            }`}>
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="text-sm text-gray-800">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                ))}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={submitQuiz}
                  isLoading={submitting}
                  disabled={Object.keys(answers).length < (quiz.questions?.length || 0)}
                >
                  Submit Quiz ({Object.keys(answers).length}/{quiz.questions?.length} answered)
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}