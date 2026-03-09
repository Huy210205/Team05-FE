import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';

interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number; // index of correct option (0-3)
}

// Mock quiz data - will be replaced with API data
// Support both old format (QUIZ-CH1) and new format (QUIZ-SEM1)
const mockQuizData: Record<string, QuizQuestion[]> = {
    'QUIZ-CH1': [
        {
            id: 1,
            question: 'AI là viết tắt của từ gì?',
            options: [
                'Automatic Intelligence',
                'Artificial Intelligence',
                'Advanced Information',
                'Automated Integration',
            ],
            correctAnswer: 1,
        },
        {
            id: 2,
            question: 'Công nghệ nào sau đây KHÔNG phải là ứng dụng của AI?',
            options: ['Nhận diện khuôn mặt', 'Trợ lý ảo', 'Máy tính thông thường', 'Xe tự lái'],
            correctAnswer: 2,
        },
        {
            id: 3,
            question: 'Machine Learning là gì?',
            options: [
                'Một ngôn ngữ lập trình',
                'Một phần của AI cho phép máy học từ dữ liệu',
                'Một loại phần cứng máy tính',
                'Một hệ điều hành',
            ],
            correctAnswer: 1,
        },
        {
            id: 4,
            question: 'Ứng dụng nào của AI đang được sử dụng nhiều trong giáo dục?',
            options: ['Chơi game', 'Cá nhân hóa học tập', 'Mua sắm online', 'Mạng xã hội'],
            correctAnswer: 1,
        },
        {
            id: 5,
            question: 'ChatGPT là một ví dụ của công nghệ nào?',
            options: ['Blockchain', 'AI tạo sinh (Generative AI)', 'IoT', 'Cloud Computing'],
            correctAnswer: 1,
        },
    ],
    'QUIZ-SEM1': [
        // Kỳ 1 - Same questions as QUIZ-CH1 for now
        {
            id: 1,
            question: 'AI là viết tắt của từ gì?',
            options: [
                'Automatic Intelligence',
                'Artificial Intelligence',
                'Advanced Information',
                'Automated Integration',
            ],
            correctAnswer: 1,
        },
        {
            id: 2,
            question: 'Công nghệ nào sau đây KHÔNG phải là ứng dụng của AI?',
            options: ['Nhận diện khuôn mặt', 'Trợ lý ảo', 'Máy tính thông thường', 'Xe tự lái'],
            correctAnswer: 2,
        },
        {
            id: 3,
            question: 'Machine Learning là gì?',
            options: [
                'Một ngôn ngữ lập trình',
                'Một phần của AI cho phép máy học từ dữ liệu',
                'Một loại phần cứng máy tính',
                'Một hệ điều hành',
            ],
            correctAnswer: 1,
        },
        {
            id: 4,
            question: 'Ứng dụng nào của AI đang được sử dụng nhiều trong giáo dục?',
            options: ['Chơi game', 'Cá nhân hóa học tập', 'Mua sắm online', 'Mạng xã hội'],
            correctAnswer: 1,
        },
        {
            id: 5,
            question: 'ChatGPT là một ví dụ của công nghệ nào?',
            options: ['Blockchain', 'AI tạo sinh (Generative AI)', 'IoT', 'Cloud Computing'],
            correctAnswer: 1,
        },
    ],
    'QUIZ-CH2': [
        {
            id: 1,
            question: 'Khanmigo là gì?',
            options: [
                'Một trò chơi giáo dục',
                'Trợ lý AI cho giáo viên và học sinh',
                'Một nền tảng mạng xã hội',
                'Một phần mềm soạn thảo',
            ],
            correctAnswer: 1,
        },
        {
            id: 2,
            question: 'AI có thể hỗ trợ giáo viên trong việc nào sau đây?',
            options: [
                'Thay thế hoàn toàn giáo viên',
                'Tạo tài liệu học tập và bài tập',
                'Chấm điểm học sinh một cách thiên vị',
                'Loại bỏ tương tác giữa giáo viên và học sinh',
            ],
            correctAnswer: 1,
        },
        {
            id: 3,
            question: 'Lợi ích lớn nhất của AI trong giáo dục là gì?',
            options: [
                'Giảm chi phí giáo dục xuống 0',
                'Cá nhân hóa trải nghiệm học tập',
                'Loại bỏ tất cả bài tập về nhà',
                'Tự động hóa hoàn toàn quá trình giảng dạy',
            ],
            correctAnswer: 1,
        },
        {
            id: 4,
            question: 'Giáo viên cần kỹ năng gì khi sử dụng AI?',
            options: [
                'Kỹ năng lập trình nâng cao',
                'Hiểu biết về AI và cách tích hợp vào giảng dạy',
                'Bằng tiến sĩ công nghệ',
                'Không cần kỹ năng gì',
            ],
            correctAnswer: 1,
        },
        {
            id: 5,
            question: 'Thách thức nào khi áp dụng AI trong giáo dục?',
            options: [
                'AI quá hoàn hảo',
                'Đảm bảo tính công bằng và đạo đức',
                'Học sinh học quá nhanh',
                'Giáo viên có quá nhiều thời gian rảnh',
            ],
            correctAnswer: 1,
        },
    ],
    'QUIZ-CH3': [
        {
            id: 1,
            question: 'Nguồn tài liệu nào đáng tin cậy nhất để học về AI?',
            options: [
                'Mạng xã hội',
                'Các lớp học trực tuyến từ các tổ chức uy tín',
                'Tin đồn trên internet',
                'Video giải trí',
            ],
            correctAnswer: 1,
        },
        {
            id: 2,
            question: 'Tại sao cần tham khảo nhiều nguồn tài liệu về AI?',
            options: [
                'Để mất thời gian',
                'Để có cái nhìn toàn diện và chính xác',
                'Để nhầm lẫn nhiều hơn',
                'Không cần thiết',
            ],
            correctAnswer: 1,
        },
        {
            id: 3,
            question: 'Khi nghiên cứu về AI, điều quan trọng nhất là gì?',
            options: [
                'Học thuộc lòng mọi thứ',
                'Hiểu nguyên lý và ứng dụng thực tế',
                'Chỉ đọc lý thuyết',
                'Bỏ qua các ví dụ thực tế',
            ],
            correctAnswer: 1,
        },
        {
            id: 4,
            question: 'Nền tảng nào cung cấp lớp học miễn phí về AI?',
            options: [
                'Chỉ có các trường đại học',
                'Coursera, edX, Khan Academy',
                'Không có lớp học miễn phí',
                'Chỉ có sách giấy',
            ],
            correctAnswer: 1,
        },
        {
            id: 5,
            question: 'Cách tốt nhất để cập nhật kiến thức về AI là gì?',
            options: [
                'Đọc một lần rồi thôi',
                'Theo dõi các nguồn tin công nghệ uy tín thường xuyên',
                'Chỉ tin vào một nguồn duy nhất',
                'Không cần cập nhật',
            ],
            correctAnswer: 1,
        },
    ],
};

export default function QuizPage() {
    const navigate = useNavigate();
    const { quizId, classId, moduleId, lessonId } = useParams<{
        quizId: string;
        classId?: string;
        moduleId?: string;
        lessonId?: string;
    }>();
    const toast = useToast();

    const questions = quizId ? mockQuizData[quizId] || [] : [];
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    // Go back to lesson viewer instead of using browser history
    const goBackToLesson = () => {
        if (classId && moduleId && lessonId) {
            navigate(`/my-classes/${classId}/modules/${moduleId}/lessons/${lessonId}`);
        } else {
            navigate(-1);
        }
    };

    // Scroll to top when component mounts
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const scrollToQuestion = (index: number) => {
        const element = document.getElementById(`question-${index}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleAnswerSelect = (questionId: number, optionIndex: number) => {
        if (submitted) return; // Không cho thay đổi sau khi nộp bài
        setAnswers((prev) => ({
            ...prev,
            [questionId]: optionIndex,
        }));
    };

    const handleSubmit = () => {
        if (Object.keys(answers).length < questions.length) {
            toast.error('Vui lòng trả lời tất cả các câu hỏi trước khi nộp bài!');
            return;
        }

        // Calculate score
        let correctCount = 0;
        questions.forEach((q) => {
            if (answers[q.id] === q.correctAnswer) {
                correctCount++;
            }
        });

        setScore(correctCount);
        setSubmitted(true);
        toast.success(`Đã nộp bài! Điểm của bạn: ${correctCount}/${questions.length}`);
    };

    const handleRetry = () => {
        setAnswers({});
        setSubmitted(false);
        setScore(0);
    };

    // Duplicate goBackToLesson removed

    if (!quizId || questions.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Không tìm thấy bài kiểm tra</p>
                    <button
                        onClick={goBackToLesson}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    const getQuizTitle = () => {
        // Check if it's a semester quiz (QUIZ-SEM1, QUIZ-SEM2, etc.)
        const semesterMatch = quizId.match(/QUIZ-SEM(\d+)/);
        if (semesterMatch) {
            return `Bài kiểm tra cuối kỳ ${semesterMatch[1]}`;
        }

        // Check if it's a chapter quiz (QUIZ-CH1, QUIZ-CH2, etc.)
        const chapterMatch = quizId.match(/QUIZ-CH(\d+)/);
        if (chapterMatch) {
            return `Bài kiểm tra cuối chương ${chapterMatch[1]}`;
        }

        return 'Bài kiểm tra';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={goBackToLesson}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Quay lại</span>
                    </button>
                    <h1 className="text-lg font-semibold text-gray-900">{getQuizTitle()}</h1>
                    <div className="w-20"></div> {/* Spacer for centering */}
                </div>
            </header>

            {/* Main Layout with Sidebar */}
            <div className="max-w-7xl mx-auto px-6 py-8 flex gap-6 h-[calc(100vh-88px)]">
                {/* Left Sidebar - Question Navigation */}
                <aside className="w-64 flex-shrink-0">
                    <div className="sticky top-24 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Các câu hỏi</h3>
                        <div className="grid grid-cols-5 gap-2">
                            {questions.map((question, index) => {
                                const isAnswered = answers[question.id] !== undefined;
                                return (
                                    <button
                                        key={question.id}
                                        onClick={() => scrollToQuestion(question.id)}
                                        className={`w-10 h-10 rounded-lg font-semibold text-sm transition ${
                                            isAnswered
                                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {index + 1}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="text-xs text-gray-600">
                                Đã trả lời:{' '}
                                <span className="font-semibold">
                                    {Object.keys(answers).length}/{questions.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0 overflow-y-auto max-h-full">
                    {/* Score Display (after submission) */}
                    {submitted && (
                        <div className="mb-6 p-6 bg-white rounded-xl shadow-sm border-2 border-blue-500">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Kết quả: {score}/{questions.length}
                                </h2>
                                <p className="text-gray-600 mb-4">
                                    Bạn đã trả lời đúng {score} câu trên tổng số {questions.length} câu
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={handleRetry}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Làm lại
                                    </button>
                                    <button
                                        onClick={goBackToLesson}
                                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                    >
                                        Quay lại lớp học
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Questions */}
                    <div className="space-y-6">
                        {questions.map((question, qIndex) => {
                            const userAnswer = answers[question.id];
                            const isCorrect = userAnswer === question.correctAnswer;

                            return (
                                <div
                                    key={question.id}
                                    id={`question-${question.id}`}
                                    className={`bg-white rounded-xl shadow-sm p-6 ${
                                        submitted
                                            ? isCorrect
                                                ? 'border-2 border-green-500'
                                                : 'border-2 border-red-500'
                                            : 'border border-gray-200'
                                    }`}
                                >
                                    {/* Question Header */}
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold flex items-center justify-center">
                                            {qIndex + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-medium text-gray-900">{question.question}</h3>
                                        </div>
                                        {submitted && (
                                            <div className="flex-shrink-0">
                                                {isCorrect ? (
                                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                                ) : (
                                                    <XCircle className="w-6 h-6 text-red-600" />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Options */}
                                    <div className="space-y-3 ml-11">
                                        {question.options.map((option, optionIndex) => {
                                            const isSelected = userAnswer === optionIndex;
                                            const isCorrectOption = optionIndex === question.correctAnswer;
                                            const showCorrect = submitted && isCorrectOption;
                                            const showWrong = submitted && isSelected && !isCorrect;

                                            return (
                                                <button
                                                    key={optionIndex}
                                                    onClick={() => handleAnswerSelect(question.id, optionIndex)}
                                                    disabled={submitted}
                                                    className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition text-left ${
                                                        showCorrect
                                                            ? 'border-green-500 bg-green-50'
                                                            : showWrong
                                                              ? 'border-red-500 bg-red-50'
                                                              : isSelected
                                                                ? 'border-blue-500 bg-blue-50'
                                                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                                    } ${submitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    {/* Radio Button */}
                                                    <div
                                                        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                            showCorrect
                                                                ? 'border-green-600'
                                                                : showWrong
                                                                  ? 'border-red-600'
                                                                  : isSelected
                                                                    ? 'border-blue-600'
                                                                    : 'border-gray-300'
                                                        }`}
                                                    >
                                                        {isSelected && (
                                                            <div
                                                                className={`w-3 h-3 rounded-full ${
                                                                    showCorrect
                                                                        ? 'bg-green-600'
                                                                        : showWrong
                                                                          ? 'bg-red-600'
                                                                          : 'bg-blue-600'
                                                                }`}
                                                            ></div>
                                                        )}
                                                    </div>

                                                    {/* Option Text */}
                                                    <span
                                                        className={`flex-1 ${
                                                            showCorrect
                                                                ? 'text-green-900 font-medium'
                                                                : showWrong
                                                                  ? 'text-red-900'
                                                                  : isSelected
                                                                    ? 'text-blue-900 font-medium'
                                                                    : 'text-gray-900'
                                                        }`}
                                                    >
                                                        {option}
                                                    </span>

                                                    {/* Correct/Wrong Icon */}
                                                    {submitted && isCorrectOption && (
                                                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                                    )}
                                                    {submitted && isSelected && !isCorrect && (
                                                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Submit Button */}
                    {!submitted && (
                        <div className="mt-8 flex justify-center">
                            <button
                                onClick={handleSubmit}
                                className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 shadow-lg transition"
                            >
                                Nộp bài
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
