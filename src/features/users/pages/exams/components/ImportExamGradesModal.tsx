import { useState, useRef } from 'react';
import { X, Upload, FileDown, Edit2, Save, Download } from 'lucide-react';
import { importGradesFromExcel, downloadGradeTemplate } from '@/shared/api/grade-entries';
import { useToast } from '@/shared/hooks/useToast';
import ExcelJS from 'exceljs';

type Props = {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    classId: number;
    moduleId: number;
    entryDate: string;
    setEntryDate: (date: string) => void;
};

type ExcelRow = {
    [key: string]: string | number;
};

export default function ImportExamGradesModal({
    open,
    onClose,
    onSuccess,
    classId,
    moduleId,
    entryDate,
    setEntryDate,
}: Props) {
    const { success, error, info } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [excelData, setExcelData] = useState<ExcelRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [showEditor, setShowEditor] = useState(false);
    const [editedData, setEditedData] = useState<ExcelRow[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Tính toán điểm tổng và pass/fail
    const calculateFinalScore = (theory: number | string, practice: number | string): number | null => {
        const theoryNum = typeof theory === 'string' ? parseFloat(theory) : theory;
        const practiceNum = typeof practice === 'string' ? parseFloat(practice) : practice;
        if (isNaN(theoryNum) || isNaN(practiceNum)) return null;
        return Math.round((theoryNum * 0.3 + practiceNum * 0.7) * 100) / 100;
    };

    const getPassStatus = (finalScore: number | null): string => {
        if (finalScore === null) return '';
        return finalScore >= 50 ? 'PASS' : 'FAIL';
    };

    const handleDownloadTemplate = async () => {
        setDownloading(true);
        try {
            await downloadGradeTemplate(classId, moduleId);
            success('Tải template thành công', 'File mẫu đã được tải về máy');
        } catch (e: any) {
            const msg = e?.response?.data?.message || 'Có lỗi xảy ra khi tải template';
            error('Lỗi tải template', msg);
        } finally {
            setDownloading(false);
        }
    };

    const handleFileSelect = async (selectedFile: File) => {
        setFile(selectedFile);
        info('Đang đọc file...', selectedFile.name);

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);

            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                error('File rỗng', 'File Excel không có sheet nào');
                return;
            }

            // Convert to JSON
            const jsonData: ExcelRow[] = [];
            const cols: string[] = [];

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) {
                    // First row is header
                    row.eachCell((cell) => {
                        cols.push(String(cell.value || ''));
                    });
                } else {
                    // Data rows
                    const rowData: ExcelRow = {};
                    row.eachCell((cell, colNumber) => {
                        const header = cols[colNumber - 1];
                        if (header) {
                            rowData[header] = cell.value as string | number;
                        }
                    });
                    jsonData.push(rowData);
                }
            });

            if (jsonData.length === 0) {
                error('File rỗng', 'File Excel không có dữ liệu');
                return;
            }

            // Set headers and data
            setHeaders(cols);
            setExcelData(jsonData);
            setEditedData(jsonData.map((row) => ({ ...row }))); // Deep copy
            setShowEditor(true);
            success('Đã đọc file thành công', `Tìm thấy ${jsonData.length} dòng dữ liệu`);
        } catch (err) {
            error('Lỗi đọc file', 'Không thể đọc file Excel. Vui lòng kiểm tra định dạng file.');
            setFile(null);
        }
    };

    const handleCellChange = (rowIndex: number, header: string, value: string | number) => {
        const newData = [...editedData];
        if (!newData[rowIndex]) {
            newData[rowIndex] = {};
        }
        newData[rowIndex][header] = value;

        // Tự động tính điểm tổng và pass/fail nếu có lý thuyết và thực hành
        const theoryHeader = headers.find((h) => h.toLowerCase().includes('theory') || h.toLowerCase().includes('lt'));
        const practiceHeader = headers.find(
            (h) => h.toLowerCase().includes('practice') || h.toLowerCase().includes('th'),
        );

        if (theoryHeader && practiceHeader) {
            const theory = newData[rowIndex][theoryHeader];
            const practice = newData[rowIndex][practiceHeader];
            const finalScore = calculateFinalScore(theory, practice);
            const passStatus = getPassStatus(finalScore);

            // Cập nhật final score và pass status nếu có cột
            const finalHeader = headers.find(
                (h) => h.toLowerCase().includes('final') || h.toLowerCase().includes('tổng'),
            );
            const passHeader = headers.find(
                (h) =>
                    h.toLowerCase().includes('pass') ||
                    h.toLowerCase().includes('status') ||
                    h.toLowerCase().includes('kết quả'),
            );

            if (finalHeader && finalScore !== null) {
                newData[rowIndex][finalHeader] = finalScore;
            }
            if (passHeader && passStatus) {
                newData[rowIndex][passHeader] = passStatus;
            }
        }

        setEditedData(newData);
    };

    const handleExportEditedExcel = async () => {
        try {
            // Create workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sheet1');

            // Add header row
            if (headers.length > 0) {
                worksheet.addRow(headers);
            }

            // Add data rows
            editedData.forEach((row) => {
                const rowValues = headers.map((header) => row[header] || '');
                worksheet.addRow(rowValues);
            });

            // Generate file name
            const fileName = file?.name.replace(/\.(xlsx|xls)$/i, '') || 'edited_grades';
            const exportFileName = `${fileName}_edited.xlsx`;

            // Write file
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = exportFileName;
            link.click();
            URL.revokeObjectURL(link.href);

            success('Đã xuất file', `File đã được lưu với tên: ${exportFileName}`);
        } catch (err) {
            error('Lỗi xuất file', 'Không thể xuất file Excel đã chỉnh sửa');
        }
    };

    const handleSaveAndContinue = async () => {
        try {
            // Create workbook from edited data
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sheet1');

            // Add header row
            if (headers.length > 0) {
                worksheet.addRow(headers);
            }

            // Add data rows
            editedData.forEach((row) => {
                const rowValues = headers.map((header) => row[header] || '');
                worksheet.addRow(rowValues);
            });

            // Convert workbook to blob
            const excelBuffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([excelBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });

            // Create new File from blob
            const fileName = file?.name || 'grades.xlsx';
            const editedFile = new File([blob], fileName, {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });

            // Update file reference
            setFile(editedFile);

            success('Đã lưu thay đổi', 'Dữ liệu đã được cập nhật. Bạn có thể import ngay.');
        } catch (err) {
            error('Lỗi lưu dữ liệu', 'Không thể lưu dữ liệu đã chỉnh sửa');
        }
    };

    const handleImport = async () => {
        if (!file) {
            error('Chưa chọn file', 'Vui lòng chọn file Excel để import');
            return;
        }

        if (!entryDate) {
            error('Chưa nhập ngày thi', 'Vui lòng nhập ngày thi trước khi import');
            return;
        }

        // If editor was opened and data exists, use edited data to create new file
        let fileToImport = file;
        if (showEditor && editedData.length > 0) {
            try {
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Sheet1');

                // Add header row
                if (headers.length > 0) {
                    worksheet.addRow(headers);
                }

                // Add data rows
                editedData.forEach((row) => {
                    const rowValues = headers.map((header) => row[header] || '');
                    worksheet.addRow(rowValues);
                });

                const excelBuffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([excelBuffer], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });
                fileToImport = new File([blob], file.name, {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });
            } catch (err) {
                error('Lỗi', 'Không thể tạo file từ dữ liệu đã chỉnh sửa. Đang sử dụng file gốc.');
            }
        }

        setImporting(true);

        try {
            await importGradesFromExcel(fileToImport, classId, moduleId, entryDate);
            success('Import hoàn tất', 'Đã nhập điểm thành công');
            onSuccess();

            // Reset state
            setFile(null);
            setExcelData([]);
            setEditedData([]);
            setHeaders([]);
            setShowEditor(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (e: any) {
            const msg = e?.response?.data?.message || 'Có lỗi xảy ra khi import';
            error('Import thất bại', msg);
        } finally {
            setImporting(false);
        }
    };

    const handleCloseEditor = () => {
        setShowEditor(false);
        setEditedData(excelData.map((row) => ({ ...row }))); // Reset to original
    };

    const handleRemoveFile = () => {
        setFile(null);
        setExcelData([]);
        setEditedData([]);
        setHeaders([]);
        setShowEditor(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClose = () => {
        handleRemoveFile();
        setEntryDate('');
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <div
                    className={`bg-white rounded-xl shadow-lg w-full ${showEditor ? 'max-w-7xl' : 'max-w-2xl'} relative max-h-[90vh] flex flex-col`}
                >
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Import Điểm từ Excel</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {showEditor
                                    ? 'Xem và chỉnh sửa dữ liệu trước khi import'
                                    : 'Tải mẫu Excel, điền điểm và upload để nhập điểm hàng loạt.'}
                            </p>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600" onClick={handleClose}>
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6 overflow-y-auto flex-1">
                        {!showEditor ? (
                            <>
                                {/* Instructions */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h3 className="text-sm font-medium text-blue-900 mb-2">📋 Hướng dẫn</h3>
                                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                        <li>Tải file mẫu bằng nút "Download Template" bên dưới</li>
                                        <li>Điền điểm lý thuyết và thực hành (0-100) vào file</li>
                                        <li>Chọn file đã điền - bạn sẽ có thể xem và chỉnh sửa trực tiếp trên trang</li>
                                        <li>Nhập ngày thi (bắt buộc) trước khi import</li>
                                        <li>Sau khi kiểm tra và chỉnh sửa xong, bấm "Import ngay"</li>
                                        <li>Hệ thống sẽ tự động tính điểm tổng và kết quả (PASS/FAIL)</li>
                                    </ol>
                                </div>

                                {/* Entry Date Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Ngày thi <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={entryDate}
                                        onChange={(e) => setEntryDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="YYYY-MM-DD"
                                    />
                                    <p className="text-xs text-gray-500">Định dạng: YYYY-MM-DD (ví dụ: 2025-01-15)</p>
                                </div>

                                {/* Actions */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        {/* Download Template Button */}
                                        <button
                                            onClick={handleDownloadTemplate}
                                            disabled={downloading || importing}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <FileDown className="w-4 h-4" />
                                            {downloading ? 'Đang tải...' : 'Download Template'}
                                        </button>

                                        {/* Choose File Button */}
                                        <label className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <Upload className="w-4 h-4" />
                                            {file ? file.name : 'Chọn file Excel'}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".xlsx,.xls"
                                                hidden
                                                disabled={importing}
                                                onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    if (f) {
                                                        handleFileSelect(f);
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>

                                    {file && !showEditor && (
                                        <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                                                    <Upload className="w-4 h-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{file.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {(file.size / 1024).toFixed(2)} KB
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setShowEditor(true)}
                                                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                    Xem & Sửa
                                                </button>
                                                <button
                                                    onClick={handleRemoveFile}
                                                    disabled={importing}
                                                    className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Progress */}
                                {importing && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Đang xử lý...</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 rounded-full animate-pulse"
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Editor View */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-base font-semibold text-gray-900">
                                                Xem và chỉnh sửa dữ liệu ({editedData.length} dòng)
                                            </h3>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                {file?.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleExportEditedExcel}
                                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-600 border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                                            >
                                                <Download className="w-4 h-4" />
                                                Xuất file đã sửa
                                            </button>
                                            <button
                                                onClick={handleCloseEditor}
                                                className="text-gray-400 hover:text-gray-600"
                                                title="Đóng trình chỉnh sửa"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Warning */}
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                        <p className="text-sm text-yellow-800">
                                            💡 <strong>Lưu ý:</strong> Khi bạn nhập điểm lý thuyết và thực hành, hệ
                                            thống sẽ tự động tính điểm tổng và kết quả (PASS/FAIL). Điểm tổng = Lý
                                            thuyết × 30% + Thực hành × 70%. Đạt nếu điểm tổng ≥ 50.
                                        </p>
                                    </div>

                                    {/* Excel Table Editor */}
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="overflow-x-auto max-h-[500px]">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50 sticky top-0 z-10">
                                                    <tr>
                                                        <th className="px-3 py-2 text-xs font-semibold text-gray-700 text-left bg-gray-100 border-r border-gray-300 sticky left-0 z-20">
                                                            STT
                                                        </th>
                                                        {headers.map((header, idx) => (
                                                            <th
                                                                key={idx}
                                                                className="px-3 py-2 text-xs font-semibold text-gray-700 text-left whitespace-nowrap border-r border-gray-300 last:border-r-0"
                                                            >
                                                                {header}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {editedData.map((row, rowIndex) => {
                                                        const theoryHeader = headers.find(
                                                            (h) =>
                                                                h.toLowerCase().includes('theory') ||
                                                                h.toLowerCase().includes('lt'),
                                                        );
                                                        const practiceHeader = headers.find(
                                                            (h) =>
                                                                h.toLowerCase().includes('practice') ||
                                                                h.toLowerCase().includes('th'),
                                                        );
                                                        const finalHeader = headers.find(
                                                            (h) =>
                                                                h.toLowerCase().includes('final') ||
                                                                h.toLowerCase().includes('tổng'),
                                                        );
                                                        const passHeader = headers.find(
                                                            (h) =>
                                                                h.toLowerCase().includes('pass') ||
                                                                h.toLowerCase().includes('status') ||
                                                                h.toLowerCase().includes('kết quả'),
                                                        );

                                                        const theory = row[theoryHeader || ''];
                                                        const practice = row[practiceHeader || ''];
                                                        const finalScore = calculateFinalScore(theory, practice);
                                                        const passStatus = getPassStatus(finalScore);

                                                        return (
                                                            <tr key={rowIndex} className="hover:bg-gray-50">
                                                                <td className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-r border-gray-200 sticky left-0 z-10">
                                                                    {rowIndex + 1}
                                                                </td>
                                                                {headers.map((header, colIndex) => {
                                                                    // Check if column is read-only (Final Score, Pass Status, or Student ID)
                                                                    const isStudentIdColumn =
                                                                        header.toLowerCase().includes('student') &&
                                                                        (header.toLowerCase().includes('id') ||
                                                                            header.toLowerCase().includes('code'));
                                                                    const isReadOnly =
                                                                        header === finalHeader ||
                                                                        header === passHeader ||
                                                                        isStudentIdColumn;

                                                                    return (
                                                                        <td
                                                                            key={colIndex}
                                                                            className="px-3 py-1 border-r border-gray-200 last:border-r-0"
                                                                        >
                                                                            {isReadOnly ? (
                                                                                <span
                                                                                    className={`text-xs font-medium ${isStudentIdColumn ? 'text-gray-700' : 'text-blue-600'}`}
                                                                                >
                                                                                    {header === finalHeader
                                                                                        ? finalScore !== null
                                                                                            ? finalScore.toFixed(2)
                                                                                            : '--'
                                                                                        : header === passHeader
                                                                                          ? passStatus || '--'
                                                                                          : row[header] || '--'}
                                                                                </span>
                                                                            ) : (
                                                                                <input
                                                                                    type="text"
                                                                                    value={row[header] || ''}
                                                                                    onChange={(e) =>
                                                                                        handleCellChange(
                                                                                            rowIndex,
                                                                                            header,
                                                                                            e.target.value,
                                                                                        )
                                                                                    }
                                                                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                                    placeholder={`Nhập ${header.toLowerCase()}...`}
                                                                                />
                                                                            )}
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Actions for Editor */}
                                    <div className="flex items-center justify-between pt-2">
                                        <div className="text-sm text-gray-600">
                                            {editedData.length} dòng dữ liệu • {headers.length} cột
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleCloseEditor}
                                                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
                                            >
                                                Đóng trình chỉnh sửa
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="p-6 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={importing}
                            className="px-6 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                        >
                            Đóng
                        </button>
                        {showEditor && (
                            <button
                                type="button"
                                onClick={handleSaveAndContinue}
                                className="px-6 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
                            >
                                <Save className="w-4 h-4 inline mr-2" />
                                Lưu và tiếp tục
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleImport}
                            disabled={importing || !file || !entryDate}
                            className="px-6 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black disabled:opacity-50"
                        >
                            {importing ? 'Đang import...' : 'Import ngay'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
