import React from 'react';
import { Bell, Mail, Smartphone, Calendar, AlertCircle } from 'lucide-react';

interface NotificationSettings {
    emailNotifications: boolean;
    pushNotifications: boolean;
    classReminders: boolean;
    assignmentDeadlines: boolean;
    systemUpdates: boolean;
}

interface NotificationsProps {
    settings: NotificationSettings;
    onSettingChange: (setting: keyof NotificationSettings, value: boolean) => void;
    onSave: () => void;
    isSaving?: boolean;
}

const Notifications: React.FC<NotificationsProps> = ({ 
    settings, 
    onSettingChange, 
    onSave, 
    isSaving = false 
}) => {
    const notificationOptions = [
        {
            key: 'emailNotifications' as keyof NotificationSettings,
            title: 'Thông báo Email',
            description: 'Nhận thông báo qua email về các hoạt động quan trọng',
            icon: Mail,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            key: 'pushNotifications' as keyof NotificationSettings,
            title: 'Thông báo Push',
            description: 'Nhận thông báo trực tiếp trên trình duyệt',
            icon: Smartphone,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            key: 'classReminders' as keyof NotificationSettings,
            title: 'Nhắc nhở lớp học',
            description: 'Thông báo trước khi lớp học bắt đầu',
            icon: Calendar,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            key: 'assignmentDeadlines' as keyof NotificationSettings,
            title: 'Hạn nộp bài tập',
            description: 'Nhắc nhở về thời hạn nộp bài tập',
            icon: AlertCircle,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
        },
        {
            key: 'systemUpdates' as keyof NotificationSettings,
            title: 'Cập nhật hệ thống',
            description: 'Thông báo về các cập nhật và bảo trì hệ thống',
            icon: Bell,
            color: 'text-gray-600',
            bgColor: 'bg-gray-50',
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-gray-900">Cài đặt thông báo</h3>
                <p className="text-xs text-gray-500 mt-1">
                    Tùy chỉnh cách bạn nhận thông báo từ hệ thống
                </p>
            </div>

            {/* Notification Options */}
            <div className="space-y-4">
                {notificationOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                        <div
                            key={option.key}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-lg ${option.bgColor} flex items-center justify-center`}>
                                    <IconComponent size={18} className={option.color} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900">{option.title}</h4>
                                    <p className="text-xs text-gray-500">{option.description}</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings[option.key]}
                                    onChange={(e) => onSettingChange(option.key, e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                            </label>
                        </div>
                    );
                })}
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
                            Đang lưu...
                        </>
                    ) : (
                        <>
                            <Bell size={16} />
                            Lưu cài đặt
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default Notifications;

