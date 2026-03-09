import React, { useState, useEffect } from 'react';
import { useToast } from '../../../../shared/hooks/useToast';
import { User, Lock, Bell, Monitor, Shield } from 'lucide-react';
import { useUserProfile } from '../../../../stores/userProfile';

// Import components
import Profile from './profile';
import Security from './security';
import Notifications from './notifications';
import Appearance from './appearance';
import Privacy from './privacy';

type TabType = 'profile' | 'security' | 'notifications' | 'appearance' | 'privacy';

export default function SettingsPage() {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<TabType>('profile');
    const { me, loading } = useUserProfile();
    const mainRole = me?.roles?.[0];

    const [formData, setFormData] = useState({
        fullName: me?.fullName ?? '',
        email: me?.email ?? '',
        phone: '',
        bio: '',
        avatar: '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: true,
        pushNotifications: true,
        classReminders: true,
        assignmentDeadlines: true,
        systemUpdates: false,
    });

    const [appearanceSettings, setAppearanceSettings] = useState<{
        theme: 'light' | 'dark' | 'auto';
        language: 'vi' | 'en';
        fontSize: 'small' | 'medium' | 'large';
        backgroundImage: string | null;
    }>({
        theme: 'light',
        language: 'vi',
        fontSize: 'medium',
        backgroundImage: null,
    });

    const [isSaving, setIsSaving] = useState(false);

    // Load settings from localStorage on component mount
    useEffect(() => {
        // Load appearance settings
        const savedAppearance = localStorage.getItem('appearanceSettings');
        if (savedAppearance) {
            const parsed = JSON.parse(savedAppearance);
            setAppearanceSettings(parsed);

            // Apply saved settings
            if (parsed.theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }

            const fontSizeMap = {
                small: '14px',
                medium: '16px',
                large: '18px',
            };
            document.documentElement.style.fontSize = fontSizeMap[parsed.fontSize as keyof typeof fontSizeMap];
        }

        // Load notification settings
        const savedNotifications = localStorage.getItem('notificationSettings');
        if (savedNotifications) {
            const parsed = JSON.parse(savedNotifications);
            setNotificationSettings(parsed);
        }

        // Load profile data
        const savedProfile = localStorage.getItem('profileData');
        if (savedProfile) {
            const parsed = JSON.parse(savedProfile);
            setFormData(parsed);
        }

        // Load user avatar from localStorage
        const savedAvatar = localStorage.getItem('userAvatar');
        if (savedAvatar) {
            setFormData(prev => ({ ...prev, avatar: savedAvatar }));
        }
    }, []);

    // Update form data when profile is loaded
    useEffect(() => {
        if (me) {
            setFormData(prev => ({
                ...prev,
                fullName: me.fullName,
                email: me.email,
            }));
        }
    }, [me]);

    const tabs = [
        { id: 'profile' as TabType, label: 'Hồ sơ', icon: User },
        { id: 'security' as TabType, label: 'Bảo mật', icon: Lock },
        { id: 'notifications' as TabType, label: 'Thông báo', icon: Bell },
        { id: 'appearance' as TabType, label: 'Giao diện', icon: Monitor },
        { id: 'privacy' as TabType, label: 'Riêng tư', icon: Shield },
    ];

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePasswordChange = (field: string, value: string) => {
        setPasswordData(prev => ({ ...prev, [field]: value }));
    };

    const handleNotificationChange = (setting: keyof typeof notificationSettings, value: boolean) => {
        setNotificationSettings(prev => ({ ...prev, [setting]: value }));
    };

    const handleAppearanceChange = (setting: keyof typeof appearanceSettings, value: any) => {
        setAppearanceSettings(prev => ({ ...prev, [setting]: value }));
    };

    const handleSaveProfile = async () => {
        try {
            setIsSaving(true);
            localStorage.setItem('profileData', JSON.stringify(formData));
            // Also save avatar to user profile for sidebar display
            localStorage.setItem('userAvatar', formData.avatar);

            // Dispatch custom event to notify AppLayout of avatar change
            window.dispatchEvent(new CustomEvent('avatarUpdated', {
                detail: { avatar: formData.avatar }
            }));

            toast.success('Thành công', 'Đã cập nhật thông tin hồ sơ!');
        } catch (error) {
            toast.error('Lỗi', 'Không thể cập nhật thông tin hồ sơ');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordSubmit = async () => {
        try {
            setIsSaving(true);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('Thành công', 'Đã thay đổi mật khẩu thành công!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error('Lỗi', 'Không thể thay đổi mật khẩu');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveNotifications = async () => {
        try {
            setIsSaving(true);
            localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
            toast.success('Thành công', 'Đã cập nhật cài đặt thông báo!');
        } catch (error) {
            toast.error('Lỗi', 'Không thể cập nhật cài đặt thông báo');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAppearance = async () => {
        try {
            setIsSaving(true);

            // Apply theme changes
            if (appearanceSettings.theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }

            // Apply font size changes
            const fontSizeMap = {
                small: '14px',
                medium: '16px',
                large: '18px',
            };
            document.documentElement.style.fontSize = fontSizeMap[appearanceSettings.fontSize as keyof typeof fontSizeMap];

            // Save to localStorage
            localStorage.setItem('appearanceSettings', JSON.stringify(appearanceSettings));

            // Apply background image if exists
            if (appearanceSettings.backgroundImage && appearanceSettings.backgroundImage.trim() !== '') {
                document.documentElement.style.setProperty('--dashboard-bg-image', `url(${appearanceSettings.backgroundImage})`);
            } else {
                document.documentElement.style.removeProperty('--dashboard-bg-image');
            }

            toast.success('Thành công', 'Đã áp dụng cài đặt giao diện thành công!');
        } catch (error) {
            toast.error('Lỗi', 'Không thể áp dụng cài đặt giao diện');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
                <p className="text-xs text-gray-500 mt-1">Quản lý cài đặt tài khoản và tùy chọn hệ thống của bạn</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-6">
                    {tabs.map((tab) => {
                        const IconComponent = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600 bg-blue-50 rounded-t-lg'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 rounded-t-lg'
                                    }`}
                            >
                                <IconComponent size={14} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="max-w-4xl">
                {activeTab === 'profile' && (
                    <Profile
                        formData={formData}
                        onInputChange={handleInputChange}
                        onSave={handleSaveProfile}
                        isSaving={isSaving}
                    />
                )}

                {activeTab === 'security' && (
                    <Security
                        passwordData={passwordData}
                        onPasswordChange={handlePasswordChange}
                        onPasswordSubmit={handlePasswordSubmit}
                        isChangingPassword={isSaving}
                    />
                )}

                {activeTab === 'notifications' && (
                    <Notifications
                        settings={notificationSettings}
                        onSettingChange={handleNotificationChange}
                        onSave={handleSaveNotifications}
                        isSaving={isSaving}
                    />
                )}

                {activeTab === 'appearance' && (
                    <Appearance
                        settings={appearanceSettings}
                        onSettingChange={handleAppearanceChange}
                        onSave={handleSaveAppearance}
                        isSaving={isSaving}
                    />
                )}

                {activeTab === 'privacy' && (
                    <Privacy />
                )}
            </div>
        </div>
    );
}

