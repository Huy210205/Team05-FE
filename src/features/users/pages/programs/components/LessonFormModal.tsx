import React, { useState, useEffect, useRef } from 'react';
import { X, Video, FileText, ClipboardList, PenTool, Download, Upload } from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import type { Lesson, LessonType, ContentType } from '@/shared/types/lesson';
import { importQuizQuestionsFromWord } from '@/shared/api/quiz';

interface LessonFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LessonFormData) => Promise<void>;
  lesson?: Lesson;
  moduleId: number;
  moduleName: string;
  existingLessons: Lesson[];
}

export interface LessonFormData {
  moduleId: number;
  lessonTitle: string;
  lessonType: LessonType;
  lessonOrder: number;
  contentUrl?: string;
  contentType?: ContentType;
  description?: string;
  isMandatory: boolean;
  passingScore?: number;
}

const LESSON_TYPE_OPTIONS: Array<{ value: LessonType; label: string; icon: React.ReactNode }> = [
  { value: 'VIDEO', label: 'Video', icon: <Video size={16} /> },
  { value: 'DOCUMENT', label: 'Tài liệu', icon: <FileText size={16} /> },
  { value: 'QUIZ', label: 'Bài kiểm tra', icon: <ClipboardList size={16} /> },
];

const CONTENT_TYPE_OPTIONS: Array<{ value: ContentType; label: string }> = [
  { value: 'VIMEO', label: 'Vimeo' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'GOOGLE_DRIVE', label: 'Google Drive' },
  { value: 'FILE_UPLOAD', label: 'File tải lên' },
];

const LessonFormModal: React.FC<LessonFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  lesson,
  moduleId,
  moduleName,
  existingLessons,
}) => {
  const { error: showError, success: showSuccess } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingQuiz, setUploadingQuiz] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<LessonFormData>({
    moduleId,
    lessonTitle: '',
    lessonType: 'VIDEO',
    lessonOrder: existingLessons.length + 1,
    contentUrl: '',
    contentType: 'VIMEO',
    description: '',
    isMandatory: true,
    passingScore: 70,
  });

  useEffect(() => {
    if (lesson) {
      setFormData({
        moduleId: lesson.moduleId,
        lessonTitle: lesson.lessonTitle,
        lessonType: lesson.lessonType,
        lessonOrder: lesson.lessonOrder,
        contentUrl: lesson.contentUrl || '',
        contentType: lesson.contentType || 'VIMEO',
        description: lesson.description || '',
        isMandatory: lesson.isMandatory,
        passingScore: lesson.passingScore || 70,
      });
    } else {
      setFormData({
        moduleId,
        lessonTitle: '',
        lessonType: 'VIDEO',
        lessonOrder: existingLessons.length + 1,
        contentUrl: '',
        contentType: 'VIMEO',
        description: '',
        isMandatory: true,
        passingScore: 70,
      });
    }
  }, [lesson, moduleId, existingLessons]);

  if (!open) return null;

  const handleUploadQuizFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng file
    const validExtensions = ['.doc', '.docx', '.txt'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      showError('File không hợp lệ', 'Vui lòng chọn file Word (.doc, .docx) hoặc Text (.txt)');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Kiểm tra xem bài học đã được tạo chưa (cần có lessonId/quizId)
    if (!lesson?.lessonId) {
      showError('Chưa thể tải lên', 'Vui lòng tạo bài học Quiz trước, sau đó mới có thể import câu hỏi từ file Word');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setUploadingQuiz(true);
      await importQuizQuestionsFromWord(lesson.lessonId, file);
      showSuccess('Thành công', `Đã import câu hỏi từ file ${file.name}`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      showError(
        'Lỗi tải lên file', 
        error?.response?.data?.message || 'Không thể import câu hỏi. Vui lòng kiểm tra lại định dạng file.'
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setUploadingQuiz(false);
    }
  };

  const handleDownloadQuizTemplate = () => {
    // Tạo nội dung file mẫu theo format mà WordImportService.java yêu cầu
    const templateContent = `Câu 1: Java là ngôn ngữ lập trình thuộc loại nào?
A. Ngôn ngữ thông dịch
B. Ngôn ngữ biên dịch và thông dịch
C. Ngôn ngữ kịch bản
D. Ngôn ngữ đánh dấu
Đáp án: B

Câu 2: JVM là viết tắt của cụm từ nào?
A. Java Variable Machine
B. Java Virtual Machine
C. Java Version Manager
D. Java Value Method
Đáp án: B

Câu 3: Từ khóa nào được sử dụng để khai báo một hằng số trong Java?
A. const
B. static
C. final
D. constant
Đáp án: C

Câu 4: Kiểu dữ liệu nào sau đây KHÔNG phải là kiểu dữ liệu nguyên thủy (primitive) trong Java?
A. int
B. boolean
C. String
D. char
Đáp án: C

Câu 5: Phương thức nào là điểm bắt đầu của một chương trình Java?
A. start()
B. main()
C. run()
D. execute()
Đáp án: B

Câu 6: Trong Java, để kế thừa một lớp ta sử dụng từ khóa nào?
A. implements
B. extends
C. inherits
D. derive
Đáp án: B

Câu 7: Interface trong Java có thể chứa những gì? (Chọn đáp án đúng nhất)
A. Chỉ có phương thức trừu tượng
B. Chỉ có hằng số
C. Phương thức trừu tượng, phương thức mặc định, phương thức tĩnh và hằng số
D. Cả phương thức và biến instance
Đáp án: C

Câu 8: Từ khóa nào được sử dụng để xử lý ngoại lệ trong Java?
A. throw và throws
B. try và finally
C. catch và finally
D. try, catch, finally
Đáp án: D

Câu 9: ArrayList trong Java thuộc package nào?
A. java.io
B. java.util
C. java.lang
D. java.awt
Đáp án: B

Câu 10: Trong Java, phương thức nào được gọi khi một đối tượng được tạo ra?
A. main()
B. start()
C. Constructor (hàm khởi tạo)
D. init()
Đáp án: C
`;

    // Tạo Blob và download
    const blob = new Blob([templateContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Quiz_Template_${moduleName.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.lessonTitle.trim()) {
      showError('Lỗi nhập liệu', 'Vui lòng nhập tiêu đề bài học');
      return;
    }

    if (formData.lessonOrder < 1) {
      showError('Lỗi nhập liệu', 'Thứ tự bài học phải lớn hơn 0');
      return;
    }

    // Validate URL nếu có
    if (formData.contentUrl && formData.contentUrl.trim()) {
      try {
        new URL(formData.contentUrl);
      } catch {
        showError('Lỗi định dạng URL', 'URL không hợp lệ. Vui lòng nhập URL đầy đủ');
        return;
      }
    }

    // Validate passing score cho QUIZ
    if (formData.lessonType === 'QUIZ' && (formData.passingScore || 0) < 0) {
      showError('Lỗi nhập liệu', 'Điểm đạt phải lớn hơn hoặc bằng 0');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Chuẩn bị data để submit
      const submitData = { ...formData };
      
      // Nếu không phải VIDEO hoặc DOCUMENT, xóa contentUrl và contentType
      if (!['VIDEO', 'DOCUMENT'].includes(formData.lessonType)) {
        delete submitData.contentUrl;
        delete submitData.contentType;
      }
      
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      // Error đã được xử lý ở parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const showContentUrlField = ['VIDEO', 'DOCUMENT'].includes(formData.lessonType);
  const showPassingScoreField = ['QUIZ'].includes(formData.lessonType);

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-lg bg-white shadow-xl border">
          {/* Header */}
          <div className="px-6 py-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {lesson ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Module: {moduleName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-lg hover:bg-white/50 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Form - với scroll */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Tiêu đề bài học */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiêu đề bài học <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lessonTitle}
                onChange={(e) => setFormData({ ...formData, lessonTitle: e.target.value })}
                placeholder="Ví dụ: Introduction to Spring Boot"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Loại bài học */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại bài học <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {LESSON_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      const newContentType = 
                        option.value === 'VIDEO' ? 'VIMEO' :
                        option.value === 'DOCUMENT' ? 'GOOGLE_DRIVE' :
                        formData.contentType;
                      setFormData({ 
                        ...formData, 
                        lessonType: option.value,
                        contentType: newContentType
                      });
                    }}
                    className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg transition-all ${
                      formData.lessonType === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {option.icon}
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Thứ tự */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thứ tự <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.lessonOrder}
                  onChange={(e) => setFormData({ ...formData, lessonOrder: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Bắt buộc */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yêu cầu
                </label>
                <select
                  value={formData.isMandatory ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, isMandatory: e.target.value === 'true' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="true">Bắt buộc</option>
                  <option value="false">Không bắt buộc</option>
                </select>
              </div>
            </div>

            {/* Content URL (cho VIDEO và DOCUMENT) */}
            {showContentUrlField && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại nội dung
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {CONTENT_TYPE_OPTIONS
                    .filter((option) => {
                      if (formData.lessonType === 'VIDEO') {
                        return option.value === 'VIMEO';
                      }
                      if (formData.lessonType === 'DOCUMENT') {
                        return option.value === 'GOOGLE_DRIVE';
                      }
                      return true;
                    })
                    .map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, contentType: option.value })}
                        className={`px-3 py-2 text-sm border-2 rounded-lg transition-all ${
                          formData.contentType === option.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                </div>
                <input
                  type="url"
                  value={formData.contentUrl}
                  onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                  placeholder={`URL ${formData.contentType === 'VIMEO' ? 'Vimeo' : formData.contentType === 'YOUTUBE' ? 'YouTube' : formData.contentType === 'GOOGLE_DRIVE' ? 'Google Drive' : 'file'}`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-2 text-xs text-gray-500">
                  {formData.contentType === 'VIMEO' && 'Ví dụ: https://vimeo.com/1139910461'}
                  {formData.contentType === 'YOUTUBE' && 'Ví dụ: https://www.youtube.com/watch?v=xxxxx'}
                  {formData.contentType === 'GOOGLE_DRIVE' && 'Ví dụ: https://drive.google.com/file/d/xxxxx/view'}
                  {formData.contentType === 'FILE_UPLOAD' && 'URL file đã tải lên server'}
                </p>
              </div>
            )}

            {/* Passing Score (cho QUIZ) */}
            {showPassingScoreField && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Điểm đạt (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.passingScore || 0}
                  onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Điểm tối thiểu để hoàn thành bài học này
                </p>
              </div>
            )}

            {/* Download Quiz Template & Upload Quiz (chỉ cho QUIZ) */}
            {formData.lessonType === 'QUIZ' && (
              <div className="space-y-3">
                {/* Download Template */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <ClipboardList className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-blue-900 mb-1">
                        File mẫu bài kiểm tra Quiz
                      </h4>
                      <p className="text-xs text-blue-700 mb-3">
                        Tải file mẫu với 10 câu hỏi trắc nghiệm, điền nội dung và tải lên hệ thống
                      </p>
                      <button
                        type="button"
                        onClick={handleDownloadQuizTemplate}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Download size={16} />
                        Tải file mẫu Quiz
                      </button>
                    </div>
                  </div>
                </div>

                {/* Upload Quiz File */}
                {lesson?.lessonId && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Upload className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-green-900 mb-1">
                          Import câu hỏi từ file Word
                        </h4>
                        <p className="text-xs text-green-700 mb-3">
                          Tải lên file Word/Text đã điền câu hỏi theo mẫu để import vào hệ thống
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".doc,.docx,.txt"
                            onChange={handleUploadQuizFile}
                            disabled={uploadingQuiz}
                            className="hidden"
                            id="quiz-file-upload"
                          />
                          <label
                            htmlFor="quiz-file-upload"
                            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                              uploadingQuiz
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            <Upload size={16} />
                            {uploadingQuiz ? 'Đang tải lên...' : 'Chọn file Word'}
                          </label>
                          <span className="text-xs text-gray-500">
                            (.doc, .docx, .txt)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!lesson?.lessonId && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-800">
                      💡 <strong>Lưu ý:</strong> Bạn cần tạo bài học Quiz trước, sau đó mới có thể import câu hỏi từ file Word
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Mô tả */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả chi tiết về bài học..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </form>

          {/* Footer - fixed tại bottom */}
          <div className="flex-shrink-0 px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang xử lý...' : lesson ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonFormModal;
