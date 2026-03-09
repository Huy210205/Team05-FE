import { useMemo, useState, useEffect } from 'react'
import { Plus, MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react'
import { getRoles, deleteRole, getPermissionGroups } from '../api'
import { useToast } from '../../../shared/hooks/useToast'
import type { Role, PermissionGroup, Permission } from '../model/types'
import CreateRoleModal from '../components/CreateRoleModal'
import EditRoleModal from '../components/EditRoleModal'
import RoleDetailModal from '../components/RoleDetailModal'


export default function RolesPage() {
    const toast = useToast()
    const [query, setQuery] = useState('')
    const [tab, setTab] = useState<'permissions' | 'roles'>('roles')
    const [openMenuId, setOpenMenuId] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // API data states
    const [roles, setRoles] = useState<Role[]>([])
    const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([])
    const [openCreate, setOpenCreate] = useState(false)
    const [openEdit, setOpenEdit] = useState<Role | null>(null)
    const [openDelete, setOpenDelete] = useState<Role | null>(null)
    const [openView, setOpenView] = useState<Role | null>(null)



    // Load roles from API
    const loadRoles = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await getRoles(true)
            setRoles(response.items)
        } catch (err) {
            setError('Không thể tải danh sách vai trò')
        } finally {
            setLoading(false)
        }
    }

    // Convert permission groups to the format expected by modals
    const permissionsForModals = useMemo(() => {
        const result: Record<string, { id: number; name: string; }[]> = {};
        permissionGroups.forEach(group => {
            result[group.categoryLabel] = group.items
                .filter((p: Permission) => p.active)
                .map((p: Permission) => ({ id: p.permissionId, name: p.name }));
        });
        return result;
    }, [permissionGroups]);



    // Load data on component mount
    useEffect(() => {
        loadRoles()
        loadPermissionGroups()
    }, [])

    const loadPermissionGroups = async () => {
        try {
            setLoading(true)
            setError(null)
            const groups = await getPermissionGroups()
            setPermissionGroups(groups)
        } catch (err) {
            setError('Không thể tải danh sách quyền')
        } finally {
            setLoading(false)
        }
    }

    const filtered = useMemo(() => roles.filter(r => r.name.toLowerCase().includes(query.toLowerCase())), [roles, query])


    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-lg font-semibold">Quản lý Vai trò</h1>
                    <p className="text-xs text-gray-500">Quản lý vai trò và phân quyền trong hệ thống</p>
                </div>
                <button
                    className="inline-flex items-center gap-2 rounded-md bg-[#030213] text-white text-sm px-4 py-2 hover:bg-black focus:ring-2 focus:ring-gray-300"
                    onClick={() => setOpenCreate(true)}
                >
                    <Plus className="w-4 h-4" />
                    Thêm Vai trò mới
                </button>
            </div>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Tổng Vai trò', value: String(roles.length) },
                    { label: 'Đang hoạt động', value: String(roles.filter(r => r.active).length) },
                    { label: 'Quyền hạn', value: String(permissionGroups.reduce((total, group) => total + group.items.filter(p => p.active).length, 0)) },
                    { label: 'Người dùng có vai trò', value: String(roles.reduce((s, r) => s + r.userCount, 0)) },
                ].map((s) => (
                    <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-6">
                        <p className="text-sm font-medium text-gray-900">{s.label}</p>
                        <p className={`text-3xl font-bold mt-8 ${s.label === 'Đang hoạt động' ? 'text-[#00a63e]' : 'text-gray-900'}`}>
                            {s.value}
                        </p>
                    </div>
                ))}
            </section>

            {/* Tabs */}
            <div className="flex items-center gap-2 mt-4">
                <button onClick={() => setTab('permissions')} className={`px-4 h-9 rounded-full text-sm inline-flex items-center gap-2 ${tab === 'permissions' ? 'bg-gray-900 text-white' : 'bg-white border'}`}>Quyền hạn</button>
                <button onClick={() => setTab('roles')} className={`px-4 h-9 rounded-full text-sm inline-flex items-center gap-2 ${tab === 'roles' ? 'bg-gray-900 text-white' : 'bg-white border'}`}>Vai trò</button>
            </div>

            {/* Top action button removed per request */}

            {/* Roles tab content */}
            {tab === 'roles' && (
                <section className="bg-white border border-gray-200 rounded-2xl p-6">
                    <div>
                        <h3 className="text-base font-medium text-gray-900">Danh sách Vai trò</h3>
                        <p className="text-sm text-[#717182] mt-1">
                            Xem và quản lý tất cả các vai trò trong hệ thống ({roles.length} vai trò)
                        </p>
                    </div>
                    <div className="px-3 py-2 border-b flex items-center gap-2">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="flex-1 h-8 rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                            placeholder="Tìm theo tên vai trò..."
                        />
                        <select className="h-8 rounded-md border px-2 text-sm">
                            <option>Tất cả trạng thái</option>
                            <option>Hoạt động</option>
                            <option>Không hoạt động</option>
                        </select>
                    </div>

                    <div className="mt-6 -mx-6">
                        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 text-sm font-medium text-gray-500">
                            <div className="col-span-3">Vai trò</div>
                            <div className="col-span-3">Quyền hạn</div>
                            <div className="col-span-2">Người dùng</div>
                            <div className="col-span-2">Ngày tạo</div>
                            <div className="col-span-2">Thao tác</div>
                        </div>

                        <div className="text-sm">
                            {filtered.map((r) => (
                                <div key={r.roleId} className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b border-gray-200">
                                    {/* Thông tin cơ bản */}
                                    <div className="col-span-3">
                                        <p className="font-medium text-gray-900">{r.name}</p>
                                        <p className="text-[#717182]">{r.code}</p>
                                    </div>

                                    {/* Quyền hạn */}
                                    <div className="col-span-3 flex flex-col gap-1.5">
                                        <div className="flex flex-wrap gap-1.5">
                                            {r.permissionNamesPreview?.slice(0, 2).map((p, i) => (
                                                <span key={`${r.roleId}-${p}-${i}`} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 text-xs">{p}</span>
                                            ))}
                                            {r.permissionCount > 2 && (
                                                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">+{r.permissionCount - 2} khác</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-[#717182]">Tổng: {r.permissionCount} quyền</div>
                                    </div>

                                    {/* Người dùng */}
                                    <div className="col-span-2">
                                        <p className="text-gray-900">{r.userCount}</p>
                                    </div>

                                    {/* Ngày tạo */}
                                    <div className="col-span-2">
                                        <p className="text-gray-900">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</p>
                                    </div>

                                    {/* Thao tác */}
                                    <div className="col-span-2 flex justify-end">
                                        <div className="relative">
                                            <button
                                                className="h-8 w-8 rounded-md border bg-white hover:bg-gray-50 inline-flex items-center justify-center"
                                                onClick={() => setOpenMenuId((prev) => (prev === r.roleId ? null : r.roleId))}
                                            >
                                                <MoreHorizontal size={16} />
                                            </button>
                                            {openMenuId === r.roleId && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                                    <div className="absolute right-0 mt-2 w-36 rounded-lg border bg-white shadow-lg z-20">
                                                        <button
                                                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                                            onClick={() => { setOpenMenuId(null); setOpenView(r) }}
                                                        >
                                                            <Eye size={16} /> Xem chi tiết
                                                        </button>
                                                        <button
                                                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                                            onClick={() => { setOpenMenuId(null); setOpenEdit(r) }}
                                                        >
                                                            <Pencil size={16} /> Chỉnh sửa
                                                        </button>
                                                        <button
                                                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                            onClick={() => { setOpenMenuId(null); setOpenDelete(r) }}
                                                        >
                                                            <Trash2 size={16} /> Xóa vai trò
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Permissions tab content */}
            {tab === 'permissions' && (
                <section className="rounded-2xl border border-gray-200 bg-white">
                    <div className="px-3 py-3 border-b flex items-start gap-2">
                        <div className="flex-1">
                            <div className="text-sm font-medium">Danh sách Quyền hạn</div>
                            <div className="text-xs text-gray-500">
                                {loading ? 'Đang tải...' : 
                                 error ? error :
                                 `Tất cả các quyền có thể được cấp trong hệ thống (${permissionGroups.reduce((total, group) => total + group.items.filter(p => p.active).length, 0)} quyền)`}
                            </div>
                        </div>
                    </div>

                    {/* Permission groups */}
                    <div className="p-3 space-y-6">
                        {loading && (
                            <div className="flex items-center justify-center py-8">
                                <div className="text-sm text-gray-500">Đang tải danh sách quyền...</div>
                            </div>
                        )}
                        
                        {error && (
                            <div className="flex items-center justify-center py-8">
                                <div className="text-sm text-red-500">{error}</div>
                            </div>
                        )}
                        
                        {!loading && !error && permissionGroups
                            .sort((a, b) => a.order - b.order)
                            .map((group) => (
                            <div key={group.category}>
                                <div className="text-sm font-medium mb-2 flex items-center justify-between">
                                    <span>{group.categoryLabel}</span>
                                    <span className="text-xs text-gray-500">
                                        {group.items.filter(p => p.active).length} quyền
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {group.items
                                        .filter(permission => permission.active)
                                        .map((permission) => (
                                        <div key={permission.permissionId} className="rounded-xl border border-gray-200">
                                            <div className="px-3 py-3 flex items-start gap-2">
                                                <div>
                                                    <div className="text-sm font-medium">{permission.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        Code: {permission.code}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        
                        {!loading && !error && permissionGroups.length === 0 && (
                            <div className="flex items-center justify-center py-8">
                                <div className="text-sm text-gray-500">Không có quyền nào được tìm thấy.</div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Create */}
            <CreateRoleModal
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                onSuccess={async () => {
                    try {
                        await loadRoles()
                        toast.success('Tạo vai trò thành công', 'Vai trò mới đã được thêm vào hệ thống')
                    } catch (error) {
                        toast.error('Lỗi tạo vai trò', 'Không thể tạo vai trò. Vui lòng thử lại')
                    }
                }}
                permissions={permissionsForModals}
            />

            {/* Edit */}
            <EditRoleModal
                open={!!openEdit}
                onClose={() => setOpenEdit(null)}
                onSuccess={async () => {
                    try {
                        await loadRoles()
                        toast.success('Cập nhật vai trò thành công', 'Thông tin vai trò đã được cập nhật')
                    } catch (error) {
                        toast.error('Lỗi cập nhật vai trò', 'Không thể cập nhật vai trò. Vui lòng thử lại')
                    }
                }}
                role={openEdit}
                permissions={permissionsForModals}
            />

            {/* View */}
            <RoleDetailModal
                open={!!openView}
                onClose={() => setOpenView(null)}
                role={openView}
                permissions={permissionsForModals}
            />

            {/* Delete confirm */}
            <div className={`fixed inset-0 z-50 ${!openDelete ? 'hidden' : ''}`}>
                <div className="fixed inset-0 bg-black/30" onClick={() => setOpenDelete(null)} />
                <div className="fixed inset-0 flex items-start justify-center pt-12 px-4">
                    <div className="w-full max-w-2xl rounded-lg bg-white shadow-lg border max-h-[85vh] overflow-auto">
                        {openDelete && (
                            <div>
                                <div className="px-4 py-3 border-b font-medium">Xác nhận xóa vai trò</div>
                                <div className="p-4">
                                    <div className="text-sm mb-4">Bạn có chắc chắn muốn xóa vai trò "{openDelete.name}" không? Hành động này không thể hoàn tác.</div>
                                    {openDelete.userCount > 0 && (
                                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                                            <div className="h-5 w-5 rounded-full bg-red-100 text-red-600 grid place-items-center">
                                                <span className="text-xs font-bold">!</span>
                                            </div>
                                            <div className="text-sm text-red-700 font-medium">
                                                Có {openDelete.userCount} người dùng đang sử dụng vai trò này!
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
                                    <button className="h-9 px-3 rounded-md border bg-white hover:bg-gray-50" onClick={() => setOpenDelete(null)}>Hủy</button>
                                    <button
                                        className="h-9 px-3 rounded-md bg-red-600 text-white hover:bg-red-700"
                                        onClick={async () => {
                                            try {
                                                await deleteRole(openDelete.roleId)
                                                await loadRoles()
                                                setOpenDelete(null)
                                                toast.success('Xóa vai trò thành công', `Vai trò "${openDelete.name}" đã được xóa khỏi hệ thống`)
                                            } catch (error) {
                                                toast.error('Lỗi xóa vai trò', 'Không thể xóa vai trò. Vui lòng thử lại')
                                            }
                                        }}
                                    >
                                        Xóa vai trò
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    )
}
