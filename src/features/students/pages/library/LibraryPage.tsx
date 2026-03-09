import { useState, useEffect } from 'react';
import {
    Library,
    FileText,
    Download,
    Search,
    Filter,
    BookOpen,
    File,
    FileVideo,
    FileImage,
    Calendar,
    User,
    Eye,
} from 'lucide-react';

type ResourceCategory = 'Tất cả' | 'Tài liệu' | 'Bài tập' | 'Đề thi' | 'Video' | 'Khác';

type Resource = {
    id: number;
    title: string;
    category: ResourceCategory;
    description?: string;
    fileName: string;
    fileSize: string;
    fileType: string;
    uploadedBy: string;
    uploadedAt: string;
    downloads: number;
    views: number;
    url: string;
};

// Mock data - sẽ thay thế bằng API call thực tế
const mockResources: Resource[] = [
    {
        id: 1,
        title: 'Tổng hợp công thức Vật lý 11',
        category: 'Tài liệu',
        description: 'Tổng hợp đầy đủ các công thức Vật lý lớp 11 theo chương trình mới',
        fileName: 'cong-thuc-vat-li-11.pdf',
        fileSize: '2.5 MB',
        fileType: 'PDF',
        uploadedBy: 'GV. Nguyễn Văn A',
        uploadedAt: '2025-11-28',
        downloads: 29582,
        views: 1780764,
        url: '#',
    },
    {
        id: 2,
        title: 'Đề giữa kỳ 1 Toán 10 năm 2025 - 2026',
        category: 'Đề thi',
        description: 'Đề thi giữa học kỳ 1 môn Toán lớp 10 năm học 2025-2026',
        fileName: 'de-giua-ky-1-toan-10.pdf',
        fileSize: '1.8 MB',
        fileType: 'PDF',
        uploadedBy: 'GV. Trần Thị B',
        uploadedAt: '2025-11-25',
        downloads: 18230,
        views: 1149272,
        url: '#',
    },
    {
        id: 3,
        title: 'Bài tập nâng cao Toán 11',
        category: 'Bài tập',
        description: 'Tổng hợp bài tập nâng cao môn Toán lớp 11 có đáp án chi tiết',
        fileName: 'bai-tap-nang-cao-toan-11.pdf',
        fileSize: '3.2 MB',
        fileType: 'PDF',
        uploadedBy: 'GV. Lê Văn C',
        uploadedAt: '2025-11-20',
        downloads: 12316,
        views: 1115526,
        url: '#',
    },
    {
        id: 4,
        title: 'Video bài giảng Hóa học 12',
        category: 'Video',
        description: 'Series video bài giảng Hóa học lớp 12 chuyên đề kim loại',
        fileName: 'hoa-hoc-12-kim-loai.mp4',
        fileSize: '450 MB',
        fileType: 'MP4',
        uploadedBy: 'GV. Phạm Thị D',
        uploadedAt: '2025-11-15',
        downloads: 8945,
        views: 654321,
        url: '#',
    },
];

const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type === 'pdf') return <FileText className="text-red-500" size={20} />;
    if (type.includes('video') || type === 'mp4') return <FileVideo className="text-purple-500" size={20} />;
    if (type.includes('image') || ['jpg', 'png', 'jpeg'].includes(type))
        return <FileImage className="text-blue-500" size={20} />;
    return <File className="text-gray-500" size={20} />;
};

const getCategoryColor = (category: ResourceCategory) => {
    switch (category) {
        case 'Tài liệu':
            return 'bg-blue-100 text-blue-700';
        case 'Bài tập':
            return 'bg-green-100 text-green-700';
        case 'Đề thi':
            return 'bg-orange-100 text-orange-700';
        case 'Video':
            return 'bg-purple-100 text-purple-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

export default function LibraryPage() {
    const [resources, setResources] = useState<Resource[]>(mockResources);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<ResourceCategory>('Tất cả');
    const [loading, setLoading] = useState(false);

    const categories: ResourceCategory[] = ['Tất cả', 'Tài liệu', 'Bài tập', 'Đề thi', 'Video', 'Khác'];

    const filteredResources = resources.filter((resource) => {
        const matchesSearch =
            resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            resource.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'Tất cả' || resource.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#003366] to-[#00556B] rounded-2xl p-8 text-white shadow-xl">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <Library size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Thư viện tài liệu</h1>
                        <p className="text-white/90">Tài liệu ôn tập chung từ giảng viên</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-white/80">
                    <div className="flex items-center gap-2">
                        <FileText size={16} />
                        <span>{resources.length} tài liệu</span>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm tài liệu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00796B] focus:border-transparent"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="flex gap-2 flex-wrap">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    selectedCategory === category
                                        ? 'bg-[#00796B] text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Resources Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00796B]"></div>
                    <p className="mt-4 text-gray-600">Đang tải...</p>
                </div>
            ) : filteredResources.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy tài liệu</h3>
                    <p className="text-gray-600">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredResources.map((resource) => (
                        <div
                            key={resource.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:border-[#B2DFDB]"
                        >
                            <div className="flex items-start gap-4">
                                {/* File Icon */}
                                <div className="flex-shrink-0 w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                                    {getFileIcon(resource.fileType)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-[#00796B] cursor-pointer">
                                                {resource.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 line-clamp-2">{resource.description}</p>
                                        </div>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getCategoryColor(resource.category)}`}
                                        >
                                            {resource.category}
                                        </span>
                                    </div>

                                    {/* Meta Info */}
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-3">
                                        <div className="flex items-center gap-1">
                                            <User size={14} />
                                            <span>{resource.uploadedBy}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            <span>{new Date(resource.uploadedAt).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <File size={14} />
                                            <span>
                                                {resource.fileType} • {resource.fileSize}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Stats and Actions */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Eye size={14} />
                                                <span>{resource.views.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Download size={14} />
                                                <span>{resource.downloads.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => window.open(resource.url, '_blank')}
                                            className="px-4 py-2 bg-[#00796B] hover:bg-[#004D40] text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm"
                                        >
                                            <Download size={16} />
                                            Tải xuống
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
