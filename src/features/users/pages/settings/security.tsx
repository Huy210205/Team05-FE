import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Shield, Check } from 'lucide-react';

interface PasswordData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

interface SecurityProps {
    passwordData: PasswordData;
    onPasswordChange: (field: string, value: string) => void;
    onPasswordSubmit: () => void;
    isChangingPassword?: boolean;
}

const Security: React.FC<SecurityProps> = ({ 
    passwordData, 
    onPasswordChange, 
    onPasswordSubmit, 
    isChangingPassword = false 
}) => {
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const isPasswordValid = passwordData.newPassword.length >= 8;
    const isPasswordMatch = passwordData.newPassword === passwordData.confirmPassword && passwordData.confirmPassword.length > 0;

    return (
        <div className="space-y-6">
            {/* Password Change */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Thay đổi mật khẩu</h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Cập nhật mật khẩu để bảo vệ tài khoản của bạn
                    </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded-full bg-yellow-100 text-yellow-600 grid place-items-center flex-shrink-0 mt-0.5">
                            <Shield size={12} />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-1">Lưu ý bảo mật</h4>
                            <p className="text-xs text-gray-600">
                                Mật khẩu mới phải có ít nhất 8 ký tự và khác với mật khẩu hiện tại
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Mật khẩu hiện tại
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords.current ? 'text' : 'password'}
                                value={passwordData.currentPassword}
                                onChange={(e) => onPasswordChange('currentPassword', e.target.value)}
                                className="w-full h-9 rounded-md border border-gray-300 px-3 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Nhập mật khẩu hiện tại"
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility('current')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Mật khẩu mới
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords.new ? 'text' : 'password'}
                                value={passwordData.newPassword}
                                onChange={(e) => onPasswordChange('newPassword', e.target.value)}
                                className="w-full h-9 rounded-md border border-gray-300 px-3 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Nhập mật khẩu mới"
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility('new')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {passwordData.newPassword && (
                            <div className="mt-1">
                                <div className={`flex items-center gap-1 text-xs ${
                                    isPasswordValid ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    <Check size={12} />
                                    {isPasswordValid ? 'Mật khẩu hợp lệ' : 'Mật khẩu phải có ít nhất 8 ký tự'}
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Xác nhận mật khẩu mới
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords.confirm ? 'text' : 'password'}
                                value={passwordData.confirmPassword}
                                onChange={(e) => onPasswordChange('confirmPassword', e.target.value)}
                                className="w-full h-9 rounded-md border border-gray-300 px-3 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Nhập lại mật khẩu mới"
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility('confirm')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {passwordData.confirmPassword && (
                            <div className="mt-1">
                                <div className={`flex items-center gap-1 text-xs ${
                                    isPasswordMatch ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    <Check size={12} />
                                    {isPasswordMatch ? 'Mật khẩu khớp' : 'Mật khẩu không khớp'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-end">
                    <button
                        onClick={onPasswordSubmit}
                        disabled={isChangingPassword || !isPasswordValid || !isPasswordMatch || !passwordData.currentPassword}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isChangingPassword ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Đang thay đổi...
                            </>
                        ) : (
                            <>
                                <Lock size={16} />
                                Thay đổi mật khẩu
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Security Features */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Tính năng bảo mật</h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Các tính năng bảo mật nâng cao cho tài khoản
                    </p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Shield size={20} className="text-green-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Tính năng đang phát triển</h4>
                    <p className="text-xs text-gray-600">Các tính năng bảo mật nâng cao sẽ sớm được cập nhật</p>
                </div>
            </div>
        </div>
    );
};

export default Security;

