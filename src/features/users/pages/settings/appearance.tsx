import React from 'react';
import { Monitor, Sun, Moon, Type, Globe, Palette } from 'lucide-react';
import BackgroundImageManager from './components/BackgroundImageManager';

interface AppearanceSettings {
    theme: 'light' | 'dark' | 'auto';
    language: 'vi' | 'en';
    fontSize: 'small' | 'medium' | 'large';
    backgroundImage: string | null;
}

interface AppearanceProps {
    settings: AppearanceSettings;
    onSettingChange: (setting: keyof AppearanceSettings, value: any) => void;
    onSave: () => void;
    isSaving?: boolean;
}

const Appearance: React.FC<AppearanceProps> = ({ 
    settings, 
    onSettingChange, 
    onSave, 
    isSaving = false 
}) => {
    const themeOptions = [
        {
            value: 'light',
            label: 'Sáng',
            description: 'Giao diện sáng, dễ nhìn',
            icon: Sun,
            preview: 'bg-white border-gray-200',
        },
        {
            value: 'dark',
            label: 'Tối',
            description: 'Giao diện tối, tiết kiệm pin',
            icon: Moon,
            preview: 'bg-gray-900 border-gray-700',
        },
        {
            value: 'auto',
            label: 'Tự động',
            description: 'Theo cài đặt hệ thống',
            icon: Monitor,
            preview: 'bg-gradient-to-r from-white to-gray-900 border-gray-400',
        },
    ];

    const languageOptions = [
        { value: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
        { value: 'en', label: 'English', flag: '🇺🇸' },
    ];

    const fontSizeOptions = [
        { value: 'small', label: 'Nhỏ', size: '14px' },
        { value: 'medium', label: 'Trung bình', size: '16px' },
        { value: 'large', label: 'Lớn', size: '18px' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-gray-900">Cài đặt giao diện</h3>
                <p className="text-xs text-gray-500 mt-1">
                    Tùy chỉnh giao diện và trải nghiệm người dùng
                </p>
            </div>

            {/* Theme Selection */}
            <div className="space-y-4">
                <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Chủ đề giao diện</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {themeOptions.map((option) => {
                            const IconComponent = option.icon;
                            return (
                                <label
                                    key={option.value}
                                    className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                                        settings.theme === option.value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="theme"
                                        value={option.value}
                                        checked={settings.theme === option.value}
                                        onChange={(e) => onSettingChange('theme', e.target.value)}
                                        className="sr-only"
                                    />
                                    <div className="flex items-center gap-3 mb-2">
                                        <IconComponent size={18} className="text-gray-600" />
                                        <span className="text-sm font-medium text-gray-900">{option.label}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-3">{option.description}</p>
                                    <div className={`h-8 rounded ${option.preview} border`}></div>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Language Selection */}
            <div className="space-y-4">
                <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Ngôn ngữ</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {languageOptions.map((option) => (
                            <label
                                key={option.value}
                                className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                                    settings.language === option.value
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="language"
                                    value={option.value}
                                    checked={settings.language === option.value}
                                    onChange={(e) => onSettingChange('language', e.target.value)}
                                    className="sr-only"
                                />
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{option.flag}</span>
                                    <span className="text-sm font-medium text-gray-900">{option.label}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Font Size Selection */}
            <div className="space-y-4">
                <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Kích thước chữ</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {fontSizeOptions.map((option) => (
                            <label
                                key={option.value}
                                className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                                    settings.fontSize === option.value
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="fontSize"
                                    value={option.value}
                                    checked={settings.fontSize === option.value}
                                    onChange={(e) => onSettingChange('fontSize', e.target.value)}
                                    className="sr-only"
                                />
                                <div className="flex flex-col items-center text-center space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Type size={18} className="text-gray-600" />
                                        <span className="text-sm font-medium text-gray-900">{option.label}</span>
                                    </div>
                                    <div className="flex items-center justify-center w-full">
                                        <span 
                                            className="text-gray-600 font-medium"
                                            style={{ fontSize: option.size }}
                                        >
                                            Aa
                                        </span>
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Background Image Management */}
            <div className="space-y-4">
                <BackgroundImageManager
                    currentImage={settings.backgroundImage}
                    onImageChange={(imageUrl) => onSettingChange('backgroundImage', imageUrl)}
                />
            </div>

            {/* Preview */}
            <div className="space-y-4">
                <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Xem trước</h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="space-y-2">
                            <h5 className="text-sm font-semibold text-gray-900">Tiêu đề mẫu</h5>
                            <p className="text-xs text-gray-600">
                                Đây là đoạn văn mẫu để bạn có thể xem trước kích thước chữ và giao diện.
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Tag mẫu</span>
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Trạng thái</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end">
                <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isSaving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Đang áp dụng...
                        </>
                    ) : (
                        <>
                            <Palette size={16} />
                            Áp dụng cài đặt
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default Appearance;

