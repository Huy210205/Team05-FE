import { useState } from 'react';
import { broadcastApi } from '@/shared/api/broadcast';
import type { BroadcastNotificationRequest } from '@/shared/api/broadcast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/shared/hooks/useToast';
import { Bell, Users, AlertTriangle, Info, AlertCircle } from 'lucide-react';

type RecipientType = 'all' | 'specific';
type SeverityType = 'INFO' | 'WARNING' | 'ERROR';

export default function BroadcastNotificationPage() {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [recipientType, setRecipientType] = useState<RecipientType>('all');
    const [severity, setSeverity] = useState<SeverityType>('INFO');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [recipientIds, setRecipientIds] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !message.trim()) {
            toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung');
            return;
        }

        try {
            setLoading(true);

            const request: BroadcastNotificationRequest = {
                title: title.trim(),
                message: message.trim(),
                severity,
                recipientIds: recipientType === 'all' ? null : parseRecipientIds(),
            };

            const response = await broadcastApi.sendBroadcastNotification(request);

            toast.success(`✅ ${response.message}! Đã gửi thành công đến ${response.sentCount} người.`);

            // Reset form
            setTitle('');
            setMessage('');
            setRecipientIds('');
            setRecipientType('all');
            setSeverity('INFO');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gửi thông báo thất bại');
        } finally {
            setLoading(false);
        }
    };

    const parseRecipientIds = (): number[] => {
        if (!recipientIds.trim()) return [];
        return recipientIds
            .split(',')
            .map((id) => parseInt(id.trim()))
            .filter((id) => !isNaN(id));
    };

    const getSeverityIcon = (type: SeverityType) => {
        switch (type) {
            case 'INFO':
                return <Info className="w-5 h-5" />;
            case 'WARNING':
                return <AlertTriangle className="w-5 h-5" />;
            case 'ERROR':
                return <AlertCircle className="w-5 h-5" />;
        }
    };

    const getSeverityColor = (type: SeverityType) => {
        switch (type) {
            case 'INFO':
                return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'WARNING':
                return 'bg-yellow-100 text-yellow-700 border-yellow-300';
            case 'ERROR':
                return 'bg-red-100 text-red-700 border-red-300';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border border-gray-100">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                            <Bell className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Gửi Thông Báo</h1>
                            <p className="text-gray-500 mt-1">Gửi thông báo đến người dùng trong hệ thống</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Main Card */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                        {/* Recipient Type */}
                        <div className="mb-6">
                            <Label className="text-base font-semibold text-gray-900 mb-3 block">Người nhận</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setRecipientType('all')}
                                    className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                                        recipientType === 'all'
                                            ? 'border-blue-500 bg-blue-50 shadow-md'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <Users className="w-5 h-5 text-blue-600" />
                                    <div className="text-left">
                                        <div className="font-semibold text-gray-900">Tất cả người dùng</div>
                                        <div className="text-sm text-gray-500">Gửi đến toàn bộ hệ thống</div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setRecipientType('specific')}
                                    className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                                        recipientType === 'specific'
                                            ? 'border-blue-500 bg-blue-50 shadow-md'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <Users className="w-5 h-5 text-purple-600" />
                                    <div className="text-left">
                                        <div className="font-semibold text-gray-900">Người dùng cụ thể</div>
                                        <div className="text-sm text-gray-500">Chọn danh sách user ID</div>
                                    </div>
                                </button>
                            </div>

                            {recipientType === 'specific' && (
                                <div className="mt-4">
                                    <Label
                                        htmlFor="recipientIds"
                                        className="text-sm font-medium text-gray-700 mb-2 block"
                                    >
                                        Danh sách User ID (phân cách bằng dấu phẩy)
                                    </Label>
                                    <input
                                        id="recipientIds"
                                        type="text"
                                        value={recipientIds}
                                        onChange={(e) => setRecipientIds(e.target.value)}
                                        placeholder="VD: 1, 2, 3, 4, 5"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                    <p className="text-sm text-gray-500 mt-2">
                                        💡 Nhập các User ID cách nhau bằng dấu phẩy
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Severity */}
                        <div className="mb-6">
                            <Label className="text-base font-semibold text-gray-900 mb-3 block">Mức độ ưu tiên</Label>
                            <div className="grid grid-cols-3 gap-4">
                                {(['INFO', 'WARNING', 'ERROR'] as SeverityType[]).map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setSeverity(type)}
                                        className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                                            severity === type
                                                ? `${getSeverityColor(type)} border-current shadow-md`
                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                        }`}
                                    >
                                        {getSeverityIcon(type)}
                                        <span className="font-semibold">{type}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Title */}
                        <div className="mb-6">
                            <Label htmlFor="title" className="text-base font-semibold text-gray-900 mb-2 block">
                                Tiêu đề <span className="text-red-500">*</span>
                            </Label>
                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Nhập tiêu đề thông báo..."
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                            />
                        </div>

                        {/* Message */}
                        <div className="mb-6">
                            <Label htmlFor="message" className="text-base font-semibold text-gray-900 mb-2 block">
                                Nội dung <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Nhập nội dung thông báo..."
                                required
                                rows={6}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-base"
                            />
                            <p className="text-sm text-gray-500 mt-2">{message.length} ký tự</p>
                        </div>

                        {/* Preview */}
                        {(title || message) && (
                            <div className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                                    📋 Xem trước
                                </h3>
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${getSeverityColor(severity)}`}>
                                            {getSeverityIcon(severity)}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 mb-1">
                                                {title || 'Tiêu đề...'}
                                            </h4>
                                            <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                                {message || 'Nội dung thông báo...'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex gap-4">
                            <Button
                                type="submit"
                                disabled={loading || !title.trim() || !message.trim()}
                                className="flex-1 py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        Đang gửi...
                                    </>
                                ) : (
                                    <>
                                        <Bell className="w-5 h-5 mr-2" />
                                        Gửi thông báo
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>

                {/* Info Card */}
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="text-sm text-blue-900">
                            <p className="font-semibold mb-2">📌 Lưu ý:</p>
                            <ul className="space-y-1 list-disc list-inside">
                                <li>Thông báo sẽ được gửi ngay lập tức</li>
                                <li>Người dùng sẽ nhận được thông báo real-time nếu đang online</li>
                                <li>Thông báo được lưu trong hệ thống và có thể xem lại sau</li>
                                <li>Chọn mức độ phù hợp: INFO (thông tin), WARNING (cảnh báo), ERROR (khẩn cấp)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
