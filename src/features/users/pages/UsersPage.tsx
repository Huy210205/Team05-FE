// src/features/users/pages/UsersPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../../../shared/hooks/useToast';
import { usePermission } from '../../../shared/components/PermissionProvider';
import { MoreHorizontal, Plus, Search, ChevronDown, Eye, Pencil, Users } from 'lucide-react';
import CreateUserModal from '../components/CreateUserModal';
import AssignRoleModal from '../components/AssignRoleModal';

import { listUserViews, getRoleStats } from '../../../shared/api/userViews';
import { getCentersLite } from '../../../shared/api/centers';
import { getRoles } from '../../../shared/api/roles';
import { createUser } from '../../../shared/api/users';
import { useCenterSelection, useEnsureCenterLoaded } from '../../../stores/centerSelection';

import type { UserViewDto, RoleCode } from '../../../shared/types/userView';
import type { CenterLiteDto } from '../../../shared/types/centers';
import type { RoleDto } from '../../../shared/types/role';

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/30" onClick={onClose} />
            <div className="fixed inset-0 flex items-start justify-center pt-12 px-4">
                <div className="w-full max-w-3xl rounded-lg bg-white shadow-lg border max-h-[85vh] overflow-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default function UsersPage() {
    // Ensure center is loaded from localStorage
    useEnsureCenterLoaded();

    // Get selected center from global store
    const globalSelectedCenterId = useCenterSelection((s) => s.selectedCenterId);

    const [openCreate, setOpenCreate] = useState(false);
    const [openView, setOpenView] = useState<UserViewDto | null>(null);
    const [openAssignRole, setOpenAssignRole] = useState<number | null>(null);
    const [query, setQuery] = useState('');
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);

    // dropdown data
    const [centers, setCenters] = useState<CenterLiteDto[]>([]);
    const [roles, setRoles] = useState<RoleDto[]>([]);

    // filters ('' = Tất cả) - keep local state for UI but sync with global store
    const [selectedCenterId, setSelectedCenterId] = useState<number | ''>(''); // dùng center lite
    const [selectedRoleCode, setSelectedRoleCode] = useState<RoleCode | ''>('');

    // Sync local center filter with global store on mount and when global changes
    useEffect(() => {
        if (globalSelectedCenterId !== null) {
            setSelectedCenterId(globalSelectedCenterId);
        }
    }, [globalSelectedCenterId]);

    // listing & stats
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<UserViewDto[]>([]);
    const [roleStats, setRoleStats] = useState<Record<string, number>>({});

    // client-side pagination (tạm)
    const [page, setPage] = useState(1);
    const pageSize = 5;

    const toast = useToast();
    const { can } = usePermission();

    // Load dropdowns (roles, centers lite) 1 lần khi mount
    useEffect(() => {
        (async () => {
            try {
                const [r, c] = await Promise.all([getRoles(true), getCentersLite()]);
                // Xử lý different data formats
                let rolesData = [];
                if (Array.isArray(r.data)) {
                    rolesData = r.data;
                } else if (r.data && typeof r.data === 'object') {
                    // Có thể data nằm trong property khác
                    const dataObj = r.data as any;
                    if (Array.isArray(dataObj.roles)) {
                        rolesData = dataObj.roles;
                    } else if (Array.isArray(dataObj.data)) {
                        rolesData = dataObj.data;
                    } else if (Array.isArray(dataObj.items)) {
                        rolesData = dataObj.items;
                    } else {
                        rolesData = [];
                    }
                }

                const centersData = Array.isArray(c.data) ? c.data : [];

                setRoles(rolesData);
                setCenters(centersData);
            } catch (e: any) {
                // Bỏ qua lỗi 403 - user không có quyền truy cập
                if (e?.response?.status !== 403) {
                    toast.error('Lỗi', 'Không tải được danh sách vai trò/trung tâm');
                }
            }
        })();
    }, []);

    // Fetch list (server-side filter) rồi áp thêm rule “phải có assignment ở center đã chọn”
    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const params: { centerId?: number; roleCode?: string; q?: string } = {};
            if (selectedCenterId !== '') params.centerId = Number(selectedCenterId);
            if (selectedRoleCode !== '') params.roleCode = String(selectedRoleCode);
            if (query.trim()) params.q = query.trim();

            const res = await listUserViews(params);
            let data = Array.isArray(res.data) ? (res.data as UserViewDto[]) : [];

            // BẢO ĐẢM: nếu đang lọc theo center, chỉ giữ user có assignment CENTER tại center đó
            if (selectedCenterId !== '') {
                const cid = Number(selectedCenterId);
                data = data.filter((u) => u.assignments?.some((a) => a.scope === 'CENTER' && a.centerId === cid));
            }

            setUsers(data);
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Tải danh sách người dùng thất bại');
        } finally {
            setLoading(false);
        }
    };

    const fetchRoleStats = async () => {
        try {
            const params: { centerId?: number } = {};
            if (selectedCenterId !== '') params.centerId = Number(selectedCenterId);
            const res = await getRoleStats(params);
            setRoleStats((res.data as Record<string, number>) || {});
        } catch (e: any) {
            // không chặn UI
        }
    };

    // gọi ngay khi mount & mỗi khi filter đổi
    useEffect(() => {
        fetchUsers();
        fetchRoleStats();
        setPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCenterId, selectedRoleCode]);

    // debounce search 300ms
    useEffect(() => {
        const t = setTimeout(() => {
            fetchUsers();
            fetchRoleStats();
            setPage(1);
        }, 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    // client-side pagination tạm thời
    const totalPages = Math.max(1, Math.ceil(users.length / pageSize));
    const pageUsers = useMemo(() => users.slice((page - 1) * pageSize, page * pageSize), [users, page]);

    // Cards thống kê
    const totalActive = users.filter((u) => u.active).length;

    // Map tất cả vai trò từ roleStats với tên từ roles list
    const allRoleStats = useMemo(() => {
        return Object.entries(roleStats)
            .map(([code, count]) => {
                const role = roles.find((r) => r.code === code);
                return {
                    code,
                    name: role?.name || code,
                    count: count,
                };
            })
            .filter((r) => r.count > 0) // Chỉ hiển thị vai trò có người dùng
            .sort((a, b) => b.count - a.count); // Sắp xếp theo số lượng giảm dần
    }, [roleStats, roles]);

    return (
        <div className="space-y-6">
            {/* Header + button */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-lg font-semibold">Quản lý Người dùng</h1>
                    <p className="text-xs text-gray-500">Quản lý tài khoản người dùng trong hệ thống</p>
                </div>
                {can('users:create') && (
                    <button
                        className="inline-flex items-center gap-2 rounded-md bg-[#030213] text-white text-sm px-4 py-2 hover:bg-black focus:ring-2 focus:ring-gray-300"
                        onClick={() => setOpenCreate(true)}
                    >
                        <Plus className="w-4 h-4" />
                        Thêm Người dùng mới
                    </button>
                )}
            </div>

            {/* Stats - Clean & Balanced design */}
            <section className="space-y-3">
                {/* Overview cards - Always 2 cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600 mb-1">Tổng Người dùng</p>
                                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600 mb-1">Đang hoạt động</p>
                                <p className="text-2xl font-bold text-[#00a63e]">{totalActive}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                                <Users className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Role stats - Horizontal scrollable compact design */}
                {allRoleStats.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Thống kê theo vai trò</p>
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                            {allRoleStats.map((role) => (
                                <div
                                    key={role.code}
                                    className="flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg px-4 py-2.5 border border-gray-200 min-w-[100px]"
                                >
                                    <p className="text-xs font-medium text-gray-600 mb-0.5 truncate" title={role.name}>
                                        {role.name}
                                    </p>
                                    <p className="text-lg font-bold text-gray-900">{role.count}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* Create User Modal */}
            <CreateUserModal
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                onSubmit={async (payload) => {
                    try {
                        await createUser(payload);
                        toast.success('Đã tạo người dùng', 'Người dùng mới đã được thêm vào danh sách');
                        await fetchUsers();
                        await fetchRoleStats();
                    } catch (e: any) {
                        const msg =
                            e?.response?.data?.message ||
                            e?.message ||
                            'Tạo người dùng thất bại (kiểm tra quyền & dữ liệu)';
                        toast.error('Lỗi', msg);
                    }
                }}
            />

            {/* Filters */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-4">
                <div className="relative flex-grow">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setPage(1);
                        }}
                        className="w-full bg-[#f3f3f5] border-transparent rounded-lg pl-10 pr-4 py-2 text-sm placeholder:text-[#717182] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Tìm kiếm theo tên hoặc email..."
                    />
                </div>

                {/* Center filter (lite, chỉ active centers) */}
                <div className="relative w-full sm:w-auto md:w-64">
                    <select
                        value={selectedCenterId}
                        onChange={(e) => setSelectedCenterId(e.target.value === '' ? '' : Number(e.target.value))}
                        className="appearance-none w-full bg-[#f3f3f5] rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Tất cả trung tâm ({centers.length})</option>
                        {centers.map((c) => (
                            <option key={c.centerId} value={c.centerId}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
                </div>

                {/* Role filter */}
                <div className="relative w-full sm:w-auto md:w-64">
                    <select
                        value={selectedRoleCode}
                        onChange={(e) => setSelectedRoleCode(e.target.value as RoleCode | '')}
                        className="appearance-none w-full bg-[#f3f3f5] rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Tất cả vai trò ({roles.length})</option>
                        {roles.map((r) => (
                            <option key={r.roleId} value={r.code}>
                                {r.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
                </div>
            </div>

            {/* Table */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6">
                <div>
                    <h3 className="text-base font-medium text-gray-900">Danh sách Người dùng</h3>
                    <p className="text-sm text-[#717182] mt-1">
                        {loading
                            ? 'Đang tải...'
                            : error
                              ? error
                              : `Xem và quản lý tất cả người dùng trong hệ thống (${users.length} kết quả)`}
                    </p>
                </div>

                <div className="mt-6 -mx-6">
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 text-sm font-medium text-gray-500">
                        <div className="col-span-3">Người dùng</div>
                        <div className="col-span-3">Vai trò & Trung tâm</div>
                        <div className="col-span-2">Chuyên môn</div>
                        <div className="col-span-2">Trạng thái</div>
                        <div className="col-span-2 text-right"></div>
                    </div>

                    <div className="text-sm">
                        {pageUsers.map((u) => {
                            // danh sách badge ưu tiên assignment theo center filter (nếu có)
                            const cid = selectedCenterId === '' ? null : Number(selectedCenterId);
                            const centerAssignments = cid
                                ? u.assignments.filter((a) => a.scope === 'CENTER' && a.centerId === cid)
                                : u.assignments;

                            const badges = (centerAssignments.length > 0 ? centerAssignments : u.assignments).slice(
                                0,
                                2,
                            );

                            return (
                                <div
                                    key={u.userId}
                                    className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b border-gray-200"
                                >
                                    {/* Thông tin cơ bản */}
                                    <div className="col-span-3">
                                        <p className="font-medium text-gray-900">{u.fullName}</p>
                                        <p className="text-[#717182]">{u.email}</p>
                                        <p className="text-[#717182]">{u.phone}</p>
                                    </div>

                                    {/* Vai trò & Trung tâm */}
                                    <div className="col-span-3 flex flex-col gap-1.5">
                                        {u.assignments.length === 0 ? (
                                            <span className="text-xs font-medium self-start px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                                                —
                                            </span>
                                        ) : (
                                            <>
                                                {badges.map((a, i) => (
                                                    <span
                                                        key={`${u.userId}-${a.roleId}-${a.centerId ?? 'global'}-${i}`}
                                                        className="text-xs font-medium self-start px-2 py-0.5 rounded-md bg-gray-100 text-gray-700"
                                                        title={`${a.roleName} • ${a.scope === 'GLOBAL' ? 'Toàn hệ thống' : a.centerName || '—'}`}
                                                    >
                                                        {a.roleName} •{' '}
                                                        {a.scope === 'GLOBAL' ? 'Toàn hệ thống' : a.centerName || '—'}
                                                    </span>
                                                ))}
                                                {(centerAssignments.length > 0 ? centerAssignments : u.assignments)
                                                    .length > 2 && (
                                                    <span className="text-xs text-[#717182]">
                                                        +
                                                        {(centerAssignments.length > 0
                                                            ? centerAssignments
                                                            : u.assignments
                                                        ).length - 2}{' '}
                                                        vai trò nữa
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Chuyên môn */}
                                    <div className="col-span-2">
                                        <p className="text-gray-900">{u.specialty ?? '—'}</p>
                                    </div>

                                    {/* Trạng thái */}
                                    <div className="col-span-2">
                                        <span
                                            className={`text-xs font-medium self-start px-2 py-0.5 rounded-md ${u.active ? 'bg-[#dcfce7] text-[#016630]' : 'bg-[#f3f4f6] text-[#1e2939]'}`}
                                        >
                                            {u.active ? 'Hoạt động' : 'Không hoạt động'}
                                        </span>
                                    </div>

                                    {/* Menu */}
                                    <div className="col-span-2 flex justify-end">
                                        <div className="relative">
                                            <button
                                                className="h-8 w-8 rounded-md border bg-white hover:bg-gray-50 inline-flex items-center justify-center"
                                                onClick={() =>
                                                    setOpenMenuId((prev) => (prev === u.userId ? null : u.userId))
                                                }
                                            >
                                                <MoreHorizontal size={16} />
                                            </button>
                                            {openMenuId === u.userId && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-10"
                                                        onClick={() => setOpenMenuId(null)}
                                                    />
                                                    <div className="absolute right-0 mt-2 w-52 rounded-lg border bg-white shadow-lg z-20">
                                                        <button
                                                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                                            onClick={() => {
                                                                setOpenMenuId(null);
                                                                setOpenView(u);
                                                            }}
                                                        >
                                                            <Eye size={16} /> Xem chi tiết
                                                        </button>
                                                        {can('users:update') && (
                                                            <button
                                                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                                                onClick={() => {
                                                                    setOpenMenuId(null);
                                                                    setOpenAssignRole(u.userId);
                                                                }}
                                                            >
                                                                <Pencil size={16} /> Gán vai trò
                                                            </button>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Pagination */}
                <nav className="flex justify-center items-center gap-2 mt-8 text-sm font-medium">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg opacity-50 disabled:opacity-50"
                    >
                        <ChevronDown className="w-4 h-4 rotate-90" />
                        <span>Previous</span>
                    </button>

                    <button
                        className={`w-9 h-9 flex items-center justify-center rounded-lg border ${page === 1 ? 'bg-white border-gray-200' : 'text-gray-900'}`}
                        onClick={() => setPage(1)}
                    >
                        1
                    </button>

                    {totalPages >= 2 && (
                        <button
                            className={`w-9 h-9 flex items-center justify-center rounded-lg ${page === 2 ? 'bg-white border border-gray-200' : 'text-gray-900'}`}
                            onClick={() => setPage(2)}
                        >
                            2
                        </button>
                    )}

                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                        <span>Next</span>
                        <ChevronDown className="w-4 h-4 -rotate-90" />
                    </button>
                </nav>
            </section>

            {/* View modal */}
            <Modal open={!!openView} onClose={() => setOpenView(null)}>
                {openView && (
                    <div>
                        <div className="px-4 py-3 border-b flex items-center justify-between">
                            <div className="font-medium">Thông tin người dùng</div>
                            <button className="h-8 w-8 rounded hover:bg-gray-100" onClick={() => setOpenView(null)}>
                                ×
                            </button>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="text-gray-500 text-xs">Họ tên</div>
                                <div>{openView.fullName}</div>
                            </div>
                            <div>
                                <div className="text-gray-500 text-xs">Email</div>
                                <div>{openView.email}</div>
                            </div>
                            <div>
                                <div className="text-gray-500 text-xs">SĐT</div>
                                <div>{openView.phone}</div>
                            </div>
                            <div className="col-span-2">
                                <div className="text-gray-500 text-xs">Vai trò</div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {openView.assignments.map((a, i) => (
                                        <span
                                            key={`${a.roleId}-${a.centerId ?? 'global'}-${i}`}
                                            className="text-xs font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-700"
                                        >
                                            {a.roleName} •{' '}
                                            {a.scope === 'GLOBAL' ? 'Toàn hệ thống' : a.centerName || '—'}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-500 text-xs">Chuyên môn</div>
                                <div>{openView.specialty ?? '—'}</div>
                            </div>
                            <div>
                                <div className="text-gray-500 text-xs">Trạng thái</div>
                                <div>{openView.active ? 'Hoạt động' : 'Không hoạt động'}</div>
                            </div>
                        </div>
                        <div className="px-4 py-3 border-t flex items-center justify-end">
                            <button
                                className="h-9 px-3 rounded-md border bg-white hover:bg-gray-50"
                                onClick={() => setOpenView(null)}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Assign Role Modal */}
            {openAssignRole && (
                <AssignRoleModal
                    userId={openAssignRole}
                    onClose={() => {
                        setOpenAssignRole(null);
                    }}
                    onSuccess={async () => {
                        // Refresh both users list and role stats after successful role assignment/revocation
                        await fetchUsers();
                        await fetchRoleStats();
                    }}
                />
            )}
        </div>
    );
}
