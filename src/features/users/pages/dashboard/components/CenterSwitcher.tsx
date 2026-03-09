import React, { useEffect, useState, useRef } from 'react';
import { useCenterSelection } from '@/stores/centerSelection';
import { listActiveCenters } from '@/shared/api/centers';
import { Building2, ChevronDown, Check } from 'lucide-react';

interface CenterItem {
    id: number;
    name: string;
    city?: string | null;
}

const CenterSwitcher: React.FC = () => {
    const { selectedCenterId, selectedCenterName, setCenter, clearCenter } = useCenterSelection();
    const [centers, setCenters] = useState<CenterItem[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadCenters = async () => {
            setLoading(true);
            try {
                const res = await listActiveCenters();
                const data = res?.data as any;
                let items: any[] = [];
                if (Array.isArray(data)) items = data;
                else if (data?.items && Array.isArray(data.items)) items = data.items;
                else if (data?.content && Array.isArray(data.content)) items = data.content;
                const mapped: CenterItem[] = items.map((c) => ({
                    id: c.id ?? c.centerId ?? c.code ?? 0,
                    name: c.name ?? c.centerName ?? 'Trung tâm',
                    city: c.city ?? c.location ?? null,
                }));
                setCenters(mapped);
            } catch (err) {
            } finally {
                setLoading(false);
            }
        };
        loadCenters();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const currentLabel = selectedCenterName || 'Tất cả trung tâm';
    const isAllCenters = !selectedCenterId;

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 group min-w-[160px]"
            >
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
                    <Building2 size={14} className="text-white" />
                </div>
                <div className="flex-1 text-left min-w-0">
                    <div className="text-[11px] font-semibold text-gray-900 truncate">{currentLabel}</div>
                </div>
                <ChevronDown 
                    size={14} 
                    className={`text-gray-400 transition-all duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`} 
                />
            </button>
            
            {open && (
                <div className="absolute right-0 mt-2 w-[280px] bg-white rounded-lg border border-gray-200 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    {/* Header */}
                    <div className="px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 border-b border-blue-400">
                        <div className="flex items-center gap-2">
                            <Building2 size={14} className="text-white" />
                            <span className="text-xs font-semibold text-white">Chọn Trung tâm</span>
                            {!loading && (
                                <span className="ml-auto text-[10px] text-blue-100">{centers.length} khả dụng</span>
                            )}
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-[320px] overflow-y-auto p-1">
                        {/* Option: Tất cả trung tâm - Purple/Pink theme */}
                        <button
                            onClick={() => {
                                clearCenter();
                                setOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 transition-all duration-200 group ${
                                isAllCenters 
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-sm' 
                                    : 'hover:bg-purple-50'
                            }`}
                        >
                            <span className="text-sm">🌐</span>
                            <div className="flex-1 min-w-0">
                                <div className={`text-xs font-semibold truncate ${
                                    isAllCenters ? 'text-white' : 'text-gray-900'
                                }`}>
                                    Tất cả trung tâm
                                </div>
                                <div className={`text-[10px] mt-0.5 truncate ${
                                    isAllCenters ? 'text-purple-100' : 'text-gray-500'
                                }`}>
                                    Xem tổng quan toàn hệ thống
                                </div>
                            </div>
                            {isAllCenters && <Check size={14} className="text-white flex-shrink-0" strokeWidth={2.5} />}
                        </button>

                        {/* Divider */}
                        <div className="my-1.5 border-t border-gray-200"></div>

                        {/* Individual Centers - Blue theme */}
                        {centers.map((c) => {
                            const active = c.id === selectedCenterId;
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => {
                                        setCenter(c.id, c.name);
                                        setOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 transition-all duration-200 group ${
                                        active 
                                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm' 
                                            : 'hover:bg-blue-50'
                                    }`}
                                >
                                    <Building2 size={14} className={active ? 'text-white' : 'text-blue-600'} />
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-xs font-semibold truncate ${
                                            active ? 'text-white' : 'text-gray-900'
                                        }`}>
                                            {c.name}
                                        </div>
                                        {c.city && (
                                            <div className={`text-[10px] mt-0.5 truncate ${
                                                active ? 'text-blue-100' : 'text-gray-500'
                                            }`}>
                                                {c.city}
                                            </div>
                                        )}
                                    </div>
                                    {active && <Check size={14} className="text-white flex-shrink-0" strokeWidth={2.5} />}
                                </button>
                            );
                        })}

                        {centers.length === 0 && !loading && (
                            <div className="px-3 py-6 text-center text-xs text-gray-500">
                                Không có trung tâm khả dụng
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CenterSwitcher;
