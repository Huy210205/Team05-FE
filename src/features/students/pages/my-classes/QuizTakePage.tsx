import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Trophy, XCircle, Award } from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import { getLessonById, updateLessonProgress } from '@/shared/api/lessons';
import type { Lesson } from '@/shared/types/lesson';
import { useProgressStore } from '../../hooks/useProgressStore';
import {
    getQuizByLesson,
    startQuizAttempt,
    saveQuizAnswers,
    submitQuiz,
    getMyQuizAttempts,
    getAttemptResult,
    type QuizDetail,
    type StartAttemptResponse,
    type QuizAnswer,
    type SubmitQuizResponse,
    type QuizAttemptHistoryResponse,
} from '@/shared/api/quiz';

type ViewState = 'loading' | 'intro' | 'taking' | 'result' | 'history';

export default function QuizTakePage() {
    const { classId, moduleId, lessonId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { setLessonStatus } = useProgressStore();

    const programId = searchParams.get('programId');

    const [viewState, setViewState] = useState<ViewState>('loading');
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [quiz, setQuiz] = useState<QuizDetail | null>(null);
    const [attemptData, setAttemptData] = useState<StartAttemptResponse | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
    const [submitResult, setSubmitResult] = useState<SubmitQuizResponse | null>(null);
    const [attemptHistory, setAttemptHistory] = useState<QuizAttemptHistoryResponse | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    useEffect(() => {
        const loadQuiz = async () => {
            if (!lessonId) return;

            try {
                setViewState('loading');

                // Load lesson and quiz data
                const [lessonResponse, quizResponse] = await Promise.all([
                    getLessonById(parseInt(lessonId)),
                    getQuizByLesson(parseInt(lessonId), false),
                ]);

                setLesson(lessonResponse.data);
                setQuiz(quizResponse.data);

                // Try to load attempt history
                try {
                    const historyResponse = await getMyQuizAttempts(quizResponse.data.quizId);
                    setAttemptHistory(historyResponse.data);
                } catch (err) {
                    // Ignore history errors
                }

                setViewState('intro');
            } catch (error: any) {
                toast.error(error?.response?.data?.message || 'Không thể tải bài kiểm tra');
                setViewState('intro');
            }
        };

        loadQuiz();
    }, [lessonId]);

    // Timer countdown
    useEffect(() => {
        if (viewState !== 'taking' || !attemptData || timeRemaining <= 0) return;

        const interval = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    handleSubmitQuiz(); // Auto submit when time's up
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [viewState, attemptData, timeRemaining]);

    const handleStartQuiz = async () => {
        if (!quiz) return;

        try {
            const response = await startQuizAttempt(quiz.quizId);
            setAttemptData(response.data);
            setSelectedAnswers({});
            setTimeRemaining(response.data.timeLimitMinutes * 60); // Convert to seconds
            setViewState('taking');
            toast.success('Đã bắt đầu làm bài kiểm tra');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Không thể bắt đầu bài kiểm tra');
        }
    };

    const handleSelectAnswer = (questionId: number, optionId: number) => {
        setSelectedAnswers((prev) => ({
            ...prev,
            [questionId]: optionId,
        }));
    };

    const handleSaveAnswers = async () => {
        if (!attemptData) return;

        try {
            const answers: QuizAnswer[] = Object.entries(selectedAnswers).map(([questionId, optionId]) => ({
                questionId: parseInt(questionId),
                selectedOptionId: optionId,
            }));

            await saveQuizAnswers(attemptData.attemptId, answers);
            toast.success('Đã lưu câu trả lời');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Không thể lưu câu trả lời');
        }
    };

    const handleSubmitQuiz = async () => {
        if (!attemptData) return;

        const totalQuestions = attemptData.questions?.length || 0;
        const answeredCount = Object.keys(selectedAnswers).length;

        if (answeredCount < totalQuestions) {
            if (
                !confirm(
                    `Bạn chưa trả lời hết các câu hỏi (${answeredCount}/${totalQuestions}). Bạn có chắc muốn nộp bài?`,
                )
            ) {
                return;
            }
        }

        try {
            // Save answers first if there are any
            if (answeredCount > 0) {
                const answers: QuizAnswer[] = Object.entries(selectedAnswers).map(([questionId, optionId]) => ({
                    questionId: parseInt(questionId),
                    selectedOptionId: optionId,
                }));
                await saveQuizAnswers(attemptData.attemptId, answers);
            }

            // Then submit
            const response = await submitQuiz(attemptData.attemptId);
            setSubmitResult(response.data);
            setViewState('result');

            // Update lesson progress - save to backend when quiz is submitted
            if (classId && moduleId && lessonId) {
                try {
                    await updateLessonProgress(parseInt(lessonId), {
                        progressPercentage: 100,
                        lastWatchedPosition: 0,
                        timeSpentSeconds: 0,
                    });
                } catch (err) {
                }
                
                // Update local state
                setLessonStatus(classId, moduleId, lessonId, 'completed');

                // Save to backend
                try {
                    await updateLessonProgress(parseInt(lessonId), {
                        progressPercentage: 100,
                        lastWatchedPosition: 0,
                        timeSpentSeconds: 0,
                    });
                } catch (error) {
                    // Continue anyway, local state is already updated
                }
            }

            // Reload history để cập nhật số lần làm
            if (quiz) {
                try {
                    const historyResponse = await getMyQuizAttempts(quiz.quizId);
                    setAttemptHistory(historyResponse.data);
                } catch (err) {
                    // Ignore
                }
            }

            if (response.data.isPassed) {
                toast.success(`Chúc mừng! Bạn đã đạt ${response.data.percentage}%`);
            } else {
                toast.error(`Bạn chưa đạt. Điểm: ${response.data.percentage}%`);
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error?.response?.data || 'Không thể nộp bài kiểm tra');
        }
    };

    const handleViewAttemptDetail = async (attemptId: number) => {
        try {
            setShowHistoryModal(false); // Close history modal first
            setViewState('loading');

            const response = await getAttemptResult(attemptId);
            setSubmitResult(response.data);
            setViewState('result');
        } catch (error: any) {
            toast.error('Không thể tải chi tiết bài làm');
            setViewState('intro');
        }
    };

    const navigateToModuleList = () => {
        // Navigate back to lesson viewer page
        if (classId && moduleId && lessonId) {
            navigate(`/my-classes/${classId}/modules/${moduleId}/lessons/${lessonId}`);
        } else {
            navigate('/my-classes');
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Render modal independently
    const renderHistoryModal = () => {
        if (!showHistoryModal || !attemptHistory || !quiz) return null;

        return (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl transform transition-all animate-slideUp">
                    <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Lịch sử làm bài</h2>
                        <button
                            onClick={() => setShowHistoryModal(false)}
                            className="text-white hover:bg-white/20 rounded-lg p-2 transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                        {/* Summary */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-blue-50 rounded-lg p-4 text-center">
                                <p className="text-blue-600 text-sm font-medium">Tổng số lần</p>
                                <p className="text-3xl font-bold text-blue-900">{attemptHistory.attempts.length}</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 text-center">
                                <p className="text-green-600 text-sm font-medium">Điểm cao nhất</p>
                                <p className="text-3xl font-bold text-green-900">
                                    {attemptHistory.bestScore
                                        ? Math.round(
                                              (attemptHistory.bestScore /
                                                  quiz.questions.reduce((sum, q) => sum + q.points, 0)) *
                                                  100,
                                          )
                                        : 0}
                                    %
                                </p>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-4 text-center">
                                <p className="text-orange-600 text-sm font-medium">Còn lại</p>
                                <p className="text-3xl font-bold text-orange-900">{attemptHistory.attemptsRemaining}</p>
                            </div>
                        </div>

                        {/* Attempts List */}
                        <h3 className="font-bold text-gray-900 mb-4">Chi tiết các lần làm bài</h3>
                        <div className="space-y-3">
                            {attemptHistory.attempts.map((attempt, index) => {
                                const isPassed = attempt.percentage >= quiz.passingScore;
                                const isCompleted = attempt.status === 'COMPLETED';
                                return (
                                    <button
                                        key={attempt.attemptId}
                                        onClick={() => isCompleted && handleViewAttemptDetail(attempt.attemptId)}
                                        disabled={!isCompleted}
                                        className={`border rounded-lg p-4 w-full text-left ${
                                            isPassed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                                        } ${isCompleted ? 'hover:shadow-md transition-shadow cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="font-bold text-gray-900">
                                                        Lần {attemptHistory.attempts.length - index}
                                                    </span>
                                                    <span
                                                        className={`px-2 py-1 rounded text-xs font-medium ${
                                                            isPassed
                                                                ? 'bg-green-200 text-green-800'
                                                                : 'bg-red-200 text-red-800'
                                                        }`}
                                                    >
                                                        {isPassed ? 'Đậu' : 'Rớt'}
                                                    </span>
                                                    {attempt.status === 'IN_PROGRESS' && (
                                                        <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-200 text-yellow-800">
                                                            Đang làm
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    Ngày làm: {new Date(attempt.startedAt).toLocaleString('vi-VN')}
                                                </p>
                                                {attempt.completedAt && (
                                                    <p className="text-sm text-gray-600">
                                                        Nộp bài: {new Date(attempt.completedAt).toLocaleString('vi-VN')}
                                                    </p>
                                                )}
                                                {attempt.timeSpentSeconds && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Thời gian: {Math.floor(attempt.timeSpentSeconds / 60)} phút{' '}
                                                        {attempt.timeSpentSeconds % 60} giây
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p
                                                    className={`text-3xl font-bold ${
                                                        isPassed ? 'text-green-700' : 'text-red-700'
                                                    }`}
                                                >
                                                    {attempt.percentage}%
                                                </p>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    {attempt.score} /{' '}
                                                    {quiz.questions.reduce((sum, q) => sum + q.points, 0)} điểm
                                                </p>
                                            </div>
                                        </div>
                                        {isCompleted && (
                                            <div className="mt-3 pt-3 border-t border-gray-400">
                                                <p className="text-xs font-semibold text-purple-700 flex items-center gap-1">
                                                    <span>👉</span>
                                                    <span>Click để xem chi tiết câu trả lời</span>
                                                </p>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (viewState === 'loading') {
        return (
            <>
                <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
                    <div className="text-sm text-gray-600">Đang tải bài kiểm tra...</div>
                </div>
                {renderHistoryModal()}
            </>
        );
    }

    if (!lesson || !quiz) {
        return (
            <>
                <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
                        <p className="text-gray-600">Không tìm thấy bài kiểm tra</p>
                        <button
                            onClick={navigateToModuleList}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Quay lại
                        </button>
                    </div>
                </div>
                {renderHistoryModal()}
            </>
        );
    } // INTRO VIEW - Show quiz info and start button
    if (viewState === 'intro') {
        return (
            <>
                <div className="fixed inset-0 bg-gray-50 overflow-y-auto">
                    <div className="min-h-screen">
                        <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                            <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
                                <button
                                    onClick={navigateToModuleList}
                                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition font-medium"
                                >
                                    <ArrowLeft size={18} /> Quay lại danh sách bài học
                                </button>
                            </div>
                        </div>

                        <div className="max-w-4xl mx-auto px-6 py-8">
                            <div className="bg-white rounded-xl p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                                        <Trophy size={32} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900">{quiz.quizTitle}</h1>
                                        <p className="text-sm text-gray-600">Bài kiểm tra trắc nghiệm</p>
                                    </div>
                                </div>

                                {lesson.description && <p className="text-gray-700 mb-6">{lesson.description}</p>}

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-blue-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 text-blue-700 mb-1">
                                            <Clock size={18} />
                                            <span className="font-semibold">Thời gian</span>
                                        </div>
                                        <p className="text-2xl font-bold text-blue-900">{quiz.timeLimitMinutes} phút</p>
                                    </div>

                                    <div className="bg-green-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 text-green-700 mb-1">
                                            <CheckCircle size={18} />
                                            <span className="font-semibold">Điểm đạt</span>
                                        </div>
                                        <p className="text-2xl font-bold text-green-900">{quiz.passingScore}%</p>
                                    </div>

                                    <div className="bg-purple-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 text-purple-700 mb-1">
                                            <Award size={18} />
                                            <span className="font-semibold">Số câu hỏi</span>
                                        </div>
                                        <p className="text-2xl font-bold text-purple-900">
                                            {quiz.questions?.length || 0}
                                        </p>
                                    </div>

                                    {attemptHistory && attemptHistory.attempts.length > 0 ? (
                                        <button
                                            onClick={() => setShowHistoryModal(true)}
                                            className="bg-orange-50 rounded-lg p-4 text-left hover:bg-orange-100 transition-colors w-full"
                                        >
                                            <div className="flex items-center gap-2 text-orange-700 mb-1">
                                                <Trophy size={18} />
                                                <span className="font-semibold">Số lần làm</span>
                                            </div>
                                            <p className="text-2xl font-bold text-orange-900">
                                                {attemptHistory.attempts.length} / {quiz.maxAttempts}
                                            </p>
                                            <p className="text-xs text-orange-600 mt-1">Click để xem lịch sử</p>
                                        </button>
                                    ) : (
                                        <div className="bg-orange-50 rounded-lg p-4">
                                            <div className="flex items-center gap-2 text-orange-700 mb-1">
                                                <Trophy size={18} />
                                                <span className="font-semibold">Số lần làm</span>
                                            </div>
                                            <p className="text-2xl font-bold text-orange-900">0 / {quiz.maxAttempts}</p>
                                        </div>
                                    )}
                                </div>

                                {attemptHistory && attemptHistory.attempts.length > 0 && (
                                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                        <h3 className="font-semibold text-gray-900 mb-2">Lịch sử làm bài</h3>
                                        <div className="flex gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600">Điểm cao nhất: </span>
                                                <span className="font-bold text-green-600">
                                                    {attemptHistory.bestScore
                                                        ? Math.round(
                                                              (attemptHistory.bestScore /
                                                                  quiz.questions.reduce(
                                                                      (sum, q) => sum + q.points,
                                                                      0,
                                                                  )) *
                                                                  100,
                                                          )
                                                        : 0}
                                                    %
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Còn lại: </span>
                                                <span className="font-bold text-blue-600">
                                                    {attemptHistory.attemptsRemaining} lần
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button
                                        onClick={handleStartQuiz}
                                        disabled={attemptHistory && attemptHistory.attempts.length >= quiz.maxAttempts}
                                        className="flex-1 px-8 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg font-bold text-lg transition"
                                    >
                                        {attemptHistory && attemptHistory.attempts.length >= quiz.maxAttempts
                                            ? 'Đã hết lượt làm bài'
                                            : 'Bắt đầu làm bài'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {renderHistoryModal()}
            </>
        );
    }

    // TAKING VIEW - Show questions and options
    if (viewState === 'taking' && attemptData) {
        return (
            <>
                <div className="fixed inset-0 bg-gray-50 overflow-y-auto">
                    <div className="min-h-screen pb-32">
                        {/* Sticky timer bar */}
                        <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                            <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                                <div className="font-semibold text-gray-900">{attemptData.quizTitle}</div>
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold ${
                                            timeRemaining < 300
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-blue-100 text-blue-700'
                                        }`}
                                    >
                                        <Clock size={18} />
                                        <span>{formatTime(timeRemaining)}</span>
                                    </div>
                                    <span className="text-sm text-gray-600">
                                        {Object.keys(selectedAnswers).length} / {attemptData.questions?.length || 0} câu
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="max-w-4xl mx-auto px-6 py-8">
                            {/* Questions */}
                            {attemptData.questions && attemptData.questions.length > 0 ? (
                                attemptData.questions.map((question, index) => (
                                    <div key={question.questionId} className="bg-white rounded-xl p-6 shadow-sm mb-4">
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                                    {question.questionText}
                                                </h3>
                                                <div className="space-y-3">
                                                    {question.options.map((option) => (
                                                        <label
                                                            key={option.optionId}
                                                            className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                                                                selectedAnswers[question.questionId] === option.optionId
                                                                    ? 'border-purple-500 bg-purple-50'
                                                                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            <input
                                                                type="radio"
                                                                name={`question-${question.questionId}`}
                                                                checked={
                                                                    selectedAnswers[question.questionId] ===
                                                                    option.optionId
                                                                }
                                                                onChange={() =>
                                                                    handleSelectAnswer(
                                                                        question.questionId,
                                                                        option.optionId,
                                                                    )
                                                                }
                                                                className="mt-1 w-4 h-4 text-purple-600"
                                                            />
                                                            <span className="flex-1 text-gray-800">
                                                                {option.optionText}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white rounded-xl p-8 text-center">
                                    <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-600">Không có câu hỏi nào</p>
                                </div>
                            )}
                        </div>

                        {/* Fixed submit bar */}
                        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
                            <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                                <button
                                    onClick={handleSaveAnswers}
                                    className="px-6 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 font-medium transition"
                                >
                                    Lưu bài
                                </button>
                                <button
                                    onClick={handleSubmitQuiz}
                                    className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition"
                                >
                                    Nộp bài
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {renderHistoryModal()}
            </>
        );
    }

    // RESULT VIEW - Show score and correct answers
    if (viewState === 'result' && submitResult) {
        return (
            <>
                <div className="fixed inset-0 bg-gray-50 overflow-y-auto">
                    <div className="min-h-screen">
                        <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                            <div className="max-w-5xl mx-auto px-6 py-4">
                                <button
                                    onClick={navigateToModuleList}
                                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition font-medium"
                                >
                                    <ArrowLeft size={18} /> Quay lại danh sách bài học
                                </button>
                            </div>
                        </div>

                        <div className="max-w-4xl mx-auto px-6 py-8">
                            {/* Score card */}
                            <div
                                className={`rounded-xl p-8 shadow-sm mb-6 text-center ${
                                    submitResult.isPassed
                                        ? 'bg-green-50 border-2 border-green-200'
                                        : 'bg-red-50 border-2 border-red-200'
                                }`}
                            >
                                <div
                                    className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                                        submitResult.isPassed ? 'bg-green-100' : 'bg-red-100'
                                    }`}
                                >
                                    {submitResult.isPassed ? (
                                        <CheckCircle size={40} className="text-green-600" />
                                    ) : (
                                        <XCircle size={40} className="text-red-600" />
                                    )}
                                </div>
                                <h2
                                    className={`text-3xl font-bold mb-2 ${
                                        submitResult.isPassed ? 'text-green-900' : 'text-red-900'
                                    }`}
                                >
                                    {submitResult.isPassed ? 'Chúc mừng! Bạn đã đạt' : 'Bạn chưa đạt'}
                                </h2>
                                <p
                                    className={`text-6xl font-bold mb-4 ${
                                        submitResult.isPassed ? 'text-green-600' : 'text-red-600'
                                    }`}
                                >
                                    {submitResult.percentage}%
                                </p>
                                <p className="text-gray-700 text-lg">
                                    Trả lời đúng: {submitResult.correctAnswers} / {submitResult.totalQuestions} câu
                                </p>
                                <p className="text-gray-700 text-sm mt-2">
                                    Điểm: {submitResult.score} / {submitResult.totalPoints}
                                </p>
                            </div>

                            {/* Answer review */}
                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <h3 className="text-xl font-bold text-gray-900 mb-6">Chi tiết câu trả lời</h3>
                                {submitResult.results && submitResult.results.length > 0 ? (
                                    submitResult.results.map((question, index) => (
                                        <div key={question.questionId} className="mb-6 pb-6 border-b last:border-b-0">
                                            <div className="flex gap-4">
                                                <div
                                                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                                        question.isCorrect
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}
                                                >
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                                                        {question.questionText}
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {/* Câu trả lời của bạn */}
                                                        {question.selectedOptionText ? (
                                                            <div
                                                                className={`p-3 rounded-lg border-2 ${
                                                                    question.isCorrect
                                                                        ? 'border-green-500 bg-green-50'
                                                                        : 'border-red-500 bg-red-50'
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <p className="text-xs font-medium text-gray-600 mb-1">
                                                                            Câu trả lời của bạn:
                                                                        </p>
                                                                        <p className="text-sm font-medium text-gray-900">
                                                                            {question.selectedOptionText}
                                                                        </p>
                                                                    </div>
                                                                    {question.isCorrect ? (
                                                                        <CheckCircle
                                                                            size={24}
                                                                            className="text-green-600 flex-shrink-0"
                                                                        />
                                                                    ) : (
                                                                        <XCircle
                                                                            size={24}
                                                                            className="text-red-600 flex-shrink-0"
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="p-3 rounded-lg border-2 border-gray-300 bg-gray-50">
                                                                <p className="text-sm text-gray-600">
                                                                    <em>Bạn chưa chọn đáp án</em>
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Đáp án đúng (nếu sai) */}
                                                        {!question.isCorrect && question.correctOptionText && (
                                                            <div className="p-3 rounded-lg border-2 border-green-500 bg-green-50">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <p className="text-xs font-medium text-green-700 mb-1">
                                                                            Đáp án đúng:
                                                                        </p>
                                                                        <p className="text-sm font-medium text-green-900">
                                                                            {question.correctOptionText}
                                                                        </p>
                                                                    </div>
                                                                    <CheckCircle
                                                                        size={24}
                                                                        className="text-green-600 flex-shrink-0"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Điểm */}
                                                        <div className="text-xs text-gray-600">
                                                            Điểm:{' '}
                                                            <span className="font-semibold">
                                                                {question.isCorrect ? question.points : 0} /{' '}
                                                                {question.points}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-600">Không có kết quả chi tiết</p>
                                )}
                            </div>

                            <div className="mt-6 flex gap-4">
                                <button
                                    onClick={navigateToModuleList}
                                    className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition"
                                >
                                    Quay lại danh sách bài học
                                </button>
                                {!submitResult.isPassed &&
                                    attemptHistory &&
                                    attemptHistory.attempts.length < quiz.maxAttempts && (
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
                                        >
                                            Làm lại bài kiểm tra
                                        </button>
                                    )}
                            </div>
                        </div>
                    </div>
                </div>
                {renderHistoryModal()}
            </>
        );
    }

    return null;
}
