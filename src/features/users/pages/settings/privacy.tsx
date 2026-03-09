import React from 'react';
import { Shield, Lock, Eye, Database, AlertTriangle } from 'lucide-react';

interface PrivacyProps {
    onSave?: () => void;
    isSaving?: boolean;
}

const Privacy: React.FC<PrivacyProps> = ({ onSave, isSaving = false }) => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-gray-900">Riêng tư</h3>
                <p className="text-xs text-gray-500 mt-1">Cài đặt quyền riêng tư và bảo mật dữ liệu</p>
            </div>

            {/* Privacy Status */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Shield size={20} className="text-green-600" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">Trạng thái bảo mật</h4>
                        <p className="text-xs text-gray-600">Tài khoản của bạn đang được bảo vệ tốt</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                        <Lock size={16} className="text-green-600" />
                        <span className="text-xs text-gray-700">Mật khẩu mạnh</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Eye size={16} className="text-green-600" />
                        <span className="text-xs text-gray-700">Quyền riêng tư</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Database size={16} className="text-green-600" />
                        <span className="text-xs text-gray-700">Dữ liệu an toàn</span>
                    </div>
                </div>
            </div>

            {/* Privacy Settings */}
            <div className="space-y-4">
                <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Cài đặt riêng tư</h4>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <Eye size={16} className="text-blue-600" />
                                </div>
                                <div>
                                    <h5 className="text-sm font-medium text-gray-900">Hiển thị thông tin công khai</h5>
                                    <p className="text-xs text-gray-500">Cho phép người khác xem thông tin cơ bản</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
                                    <Database size={16} className="text-purple-600" />
                                </div>
                                <div>
                                    <h5 className="text-sm font-medium text-gray-900">Chia sẻ dữ liệu phân tích</h5>
                                    <p className="text-xs text-gray-500">Giúp cải thiện trải nghiệm người dùng</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center">
                                    <AlertTriangle size={16} className="text-orange-600" />
                                </div>
                                <div>
                                    <h5 className="text-sm font-medium text-gray-900">Thông báo bảo mật</h5>
                                    <p className="text-xs text-gray-500">Nhận cảnh báo về các hoạt động đáng ngờ</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Management */}
            <div className="space-y-4">
                <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Quản lý dữ liệu</h4>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div>
                                <h5 className="text-sm font-medium text-gray-900">Xuất dữ liệu</h5>
                                <p className="text-xs text-gray-500">Tải xuống tất cả dữ liệu của bạn</p>
                            </div>
                            <button className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">
                                Xuất
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div>
                                <h5 className="text-sm font-medium text-gray-900">Xóa tài khoản</h5>
                                <p className="text-xs text-gray-500">Xóa vĩnh viễn tài khoản và dữ liệu</p>
                            </div>
                            <button className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors">
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Coming Soon */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield size={20} className="text-green-600" />
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Chức năng đang phát triển</h4>
                <p className="text-xs text-gray-600">Tính năng riêng tư sẽ sớm được cập nhật</p>
            </div>

            {/* Save Button */}
            {onSave && (
                <div className="flex items-center justify-end">
                    <button
                        onClick={onSave}
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Shield size={16} />
                                Lưu cài đặt
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Privacy;

