'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import api from '@/lib/api';
import { Plus, Trash2, Save } from 'lucide-react';

interface Question {
  text: string;
  options: string[];
  answer: string;
}

export default function QuizEditorPage() {
  const { courseId, lessonId } = useParams();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([
    { text: '', options: ['', '', '', ''], answer: '' },
  ]);
  const [existingQuizId, setExistingQuizId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<any>(null);

  // Load existing quiz if any
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const courseRes = await api.get(`/courses/${courseId}`);
        const lesson = courseRes.data.course.modules
          .flatMap((m: any) => m.lessons)
          .find((l: any) => l.id === lessonId);

        if (lesson?.quiz) {
          setExistingQuizId(lesson.quiz.id);
          setQuestions(
            lesson.quiz.questions.map((q: any) => ({
              text: q.text,
              options: q.options,
              answer: q.answer,
            }))
          );
        }
      } catch {}
    };
    loadQuiz();
  }, [courseId, lessonId]);

  const addQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', '', '', ''], answer: '' }]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: string, value: string) => {
    const updated = [...questions];
    (updated[idx] as any)[field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = value;
    setQuestions(updated);
  };

  const saveQuiz = async () => {
    // Validate
    for (const q of questions) {
      if (!q.text.trim()) return setAlert({ type: 'error', message: 'All questions need text' });
      if (q.options.some((o) => !o.trim())) return setAlert({ type: 'error', message: 'All options must be filled' });
      if (!q.answer.trim()) return setAlert({ type: 'error', message: 'All questions need a correct answer' });
      if (!q.options.includes(q.answer)) return setAlert({ type: 'error', message: 'Correct answer must match one of the options' });
    }

    setSaving(true);
    try {
      if (existingQuizId) {
        await api.put(`/quizzes/${existingQuizId}`, { questions });
      } else {
        await api.post(`/quizzes/lessons/${lessonId}/quiz`, { questions });
      }
      setAlert({ type: 'success', message: 'Quiz saved successfully!' });
      setTimeout(() => router.push(`/instructor/courses/${courseId}`), 1500);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.response?.data?.error || 'Failed to save quiz' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Quiz Editor">
      <div className="space-y-4 max-w-3xl mx-auto">
        {alert && <Alert type={alert.type} message={alert.message} />}

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{questions.length} question(s)</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={addQuestion}>
              <Plus className="w-4 h-4 mr-1" /> Add Question
            </Button>
            <Button onClick={saveQuiz} isLoading={saving}>
              <Save className="w-4 h-4 mr-1" /> Save Quiz
            </Button>
          </div>
        </div>

        {questions.map((q, qIdx) => (
          <div key={qIdx} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-bold text-blue-600 mt-2">Q{qIdx + 1}</span>
              <div className="flex-1">
                <Input
                  label="Question"
                  value={q.text}
                  onChange={(e) => updateQuestion(qIdx, 'text', e.target.value)}
                  placeholder="e.g. What does VFR stand for?"
                />
              </div>
              {questions.length > 1 && (
                <button
                  onClick={() => removeQuestion(qIdx)}
                  className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {q.options.map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 w-5">
                    {String.fromCharCode(65 + oIdx)}
                  </span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
              <select
                value={q.answer}
                onChange={(e) => updateQuestion(qIdx, 'answer', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select correct answer...</option>
                {q.options.filter((o) => o.trim()).map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}