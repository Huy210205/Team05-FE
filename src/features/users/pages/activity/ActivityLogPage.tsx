import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { notificationsApi } from '@/shared/api/notifications';
import type { NotificationItem } from '@/shared/types/notification';
import { Filter, Calendar, Send, X, Users, AlertTriangle, Info, AlertCircle, Bell, ChevronDown, Check } from 'lucide-react';
import { broadcastApi } from '@/shared/api/broadcast';
import type { BroadcastNotificationRequest } from '@/shared/api/broadcast';
import { listUsers } from '@/shared/api/users';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/shared/hooks/useToast';

type RecipientType = 'all' | 'specific';
type SeverityType = 'INFO' | 'WARNING' | 'ERROR';

export default function ActivityLogPage() {
  const toast = useToast();
  const [activities, setActivities] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMentionedOnly, setShowMentionedOnly] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'read' | 'unread'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  // Broadcast modal states
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [recipientType, setRecipientType] = useState<RecipientType>('all');
  const [severity, setSeverity] = useState<SeverityType>('INFO');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [users, setUsers] = useState<Array<{ userId: number; fullName: string; email: string }>>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showSeverityDropdown, setShowSeverityDropdown] = useState(false);

  useEffect(() => {
    loadActivities();
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await listUsers();
      setUsers(response.data);
    } catch (error) {
    }
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showBroadcastModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showBroadcastModal]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await notificationsApi.getMyNotifications();
      setActivities(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Filter activities by status
  const filteredActivities = activities.filter((activity) => {
    if (filterStatus === 'read') return activity.isRead;
    if (filterStatus === 'unread') return !activity.isRead;
    return true; // 'all'
  });

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = new Date(activity.createdAt);
    const dateKey = date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    }).toUpperCase();

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(activity);
    return groups;
  }, {} as Record<string, NotificationItem[]>);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'GRADE_UPDATED':
        return '📊';
      case 'CLASS_CREATED':
        return '🏫';
      case 'CENTER_CREATED':
        return '🏢';
      case 'LECTURER_GRADED':
        return '📝';
      case 'ENROLLED_NEW_CLASS':
        return '🎓';
      case 'CLASS_UPDATED':
        return '📅';
      case 'ATTENDANCE_RECORDED':
        return '✅';
      case 'SYSTEM_ANNOUNCEMENT':
        return '📣';
      default:
        return '📢';
    }
  };

  const getActivityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung');
      return;
    }

    try {
      setSendingBroadcast(true);

      const request: BroadcastNotificationRequest = {
        title: title.trim(),
        message: message.trim(),
        severity,
        recipientIds: recipientType === 'all' ? null : selectedUserIds.length > 0 ? selectedUserIds : null,
      };

      const response = await broadcastApi.sendBroadcastNotification(request);

      toast.success(
        `Đã gửi thành công đến ${response.sentCount} người`,
        response.message
      );

      // Reset form and close modal
      setTitle('');
      setMessage('');
      setSelectedUserIds([]);
      setRecipientType('all');
      setSeverity('INFO');
      setShowBroadcastModal(false);
      setUserSearchTerm('');
      
      // Reload activities to show new notification
      loadActivities();
    } catch (error: any) {
      toast.error(
        'Gửi thông báo thất bại',
        error.response?.data?.message || 'Có lỗi xảy ra khi gửi thông báo'
      );
    } finally {
      setSendingBroadcast(false);
    }
  };
  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải hoạt động...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Top Bar with Send Button */}
        <div className="flex items-center justify-between mb-6">
          <div></div>
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
          >
            <Send className="w-4 h-4" />
            <span className="font-medium">Gửi thông báo</span>
          </button>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Activity log</h1>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <span>Show mentioned only</span>
                <input
                  type="checkbox"
                  checked={showMentionedOnly}
                  onChange={(e) => setShowMentionedOnly(e.target.checked)}
                  className="w-10 h-6 rounded-full appearance-none bg-gray-200 checked:bg-blue-600 relative cursor-pointer transition-colors
                    after:content-[''] after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform
                    checked:after:translate-x-4"
                />
              </label>
              
              <div className="relative">
                <button 
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${
                    filterStatus !== 'all' ? 'bg-blue-50' : ''
                  }`}
                >
                  <Filter className={`w-5 h-5 ${
                    filterStatus !== 'all' ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                </button>

                {showFilterMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                    <button
                      onClick={() => {
                        setFilterStatus('all');
                        setShowFilterMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                        filterStatus === 'all' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => {
                        setFilterStatus('unread');
                        setShowFilterMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                        filterStatus === 'unread' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      Chưa đọc
                    </button>
                    <button
                      onClick={() => {
                        setFilterStatus('read');
                        setShowFilterMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                        filterStatus === 'read' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      Đã đọc
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="space-y-8">
          {Object.entries(groupedActivities).map(([dateKey, dateActivities]) => (
            <div key={dateKey}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  {dateKey}
                </h2>
              </div>

              {/* Activities */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {dateActivities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className={`flex items-start gap-4 p-5 hover:bg-gray-50 transition-colors ${
                      index !== dateActivities.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(
                          activity.severity
                        )}`}
                      >
                        <span className="text-lg">{getActivityIcon(activity.type)}</span>
                      </div>
                      {index !== dateActivities.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {activity.title}
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {activity.message}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          {formatTime(activity.createdAt)}
                        </span>
                      </div>

                      {/* Related info */}
                      {activity.relatedType && (
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                          <span className="font-medium">{activity.relatedType}</span>
                          {activity.relatedId && (
                            <>
                              <span>•</span>
                              <span>#{activity.relatedId}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Read indicator */}
                    {!activity.isRead && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredActivities.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Calendar className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Không có hoạt động nào
              </h3>
              <p className="text-gray-500">
                {filterStatus === 'read' && 'Không có hoạt động đã đọc'}
                {filterStatus === 'unread' && 'Không có hoạt động chưa đọc'}
                {filterStatus === 'all' && 'Các hoạt động của bạn sẽ hiển thị ở đây'}
              </p>
            </div>
          )}
        </div>

        {/* Broadcast Modal */}
        {showBroadcastModal && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50"
              onClick={() => setShowBroadcastModal(false)}
            />
            
            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Gửi Thông Báo</h2>
                    <p className="text-sm text-gray-500">Gửi thông báo đến người dùng trong hệ thống</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBroadcastModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleBroadcastSubmit} className="p-6 space-y-6">
                {/* Recipient Type */}
                <div>
                  <Label className="text-base font-semibold text-gray-900 mb-3 block">
                    Người nhận
                  </Label>
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
                        <div className="font-semibold text-gray-900">Tất cả</div>
                        <div className="text-xs text-gray-500">Toàn bộ hệ thống</div>
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
                        <div className="font-semibold text-gray-900">Cụ thể</div>
                        <div className="text-xs text-gray-500">Chọn user ID</div>
                      </div>
                    </button>
                  </div>

                  {recipientType === 'specific' && (
                    <div className="mt-4 relative">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Chọn người dùng ({selectedUserIds.length} đã chọn)
                      </Label>
                      
                      {/* Search Input with Selected Tags */}
                      <div 
                        className="relative min-h-[42px] px-3 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent cursor-text"
                        onClick={(e) => {
                          const input = e.currentTarget.querySelector('input');
                          if (input) input.focus();
                        }}
                      >
                        <div className="flex flex-wrap gap-2 items-center">
                          {/* Selected Users Tags */}
                          {selectedUserIds.map(userId => {
                            const user = users.find(u => u.userId === userId);
                            return user ? (
                              <span
                                key={userId}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                              >
                                {user.fullName}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleUserSelection(userId);
                                  }}
                                  className="hover:bg-blue-200 rounded-full p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ) : null;
                          })}
                          
                          {/* Search Input */}
                          <input
                            type="text"
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            onFocus={() => setShowUserDropdown(true)}
                            placeholder={selectedUserIds.length === 0 ? "Tìm kiếm theo tên hoặc email..." : ""}
                            className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
                          />
                          
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>

                      {/* Dropdown List */}
                      {showUserDropdown && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setShowUserDropdown(false)}
                          />
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredUsers.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                Không tìm thấy người dùng
                              </div>
                            ) : (
                              filteredUsers.map(user => (
                                <button
                                  key={user.userId}
                                  type="button"
                                  onClick={() => toggleUserSelection(user.userId)}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">{user.fullName}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                  </div>
                                  {selectedUserIds.includes(user.userId) && (
                                    <Check className="w-5 h-5 text-blue-600" />
                                  )}
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Severity */}
                <div className="relative">
                  <Label className="text-base font-semibold text-gray-900 mb-2 block">
                    Mức độ ưu tiên
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowSeverityDropdown(!showSeverityDropdown)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(severity)}
                      <span className="font-medium text-gray-900">{severity}</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showSeverityDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown */}
                  {showSeverityDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowSeverityDropdown(false)}
                      />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                        {(['INFO', 'WARNING', 'ERROR'] as SeverityType[]).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              setSeverity(type);
                              setShowSeverityDropdown(false);
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between transition-colors ${
                              severity === type ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {getSeverityIcon(type)}
                              <span className="font-medium text-gray-900">{type}</span>
                            </div>
                            {severity === type && (
                              <Check className="w-5 h-5 text-blue-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Title */}
                <div>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Message */}
                <div>
                  <Label htmlFor="message" className="text-base font-semibold text-gray-900 mb-2 block">
                    Nội dung <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Nhập nội dung thông báo..."
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">{message.length} ký tự</p>
                </div>

                {/* Preview */}
                {(title || message) && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase">📋 Xem trước</h3>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getSeverityColor(severity)}`}>
                          {getSeverityIcon(severity)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm mb-1">
                            {title || 'Tiêu đề...'}
                          </h4>
                          <p className="text-xs text-gray-600 whitespace-pre-wrap">
                            {message || 'Nội dung thông báo...'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBroadcastModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={sendingBroadcast || !title.trim() || !message.trim()}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {sendingBroadcast ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Gửi thông báo
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
