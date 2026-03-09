import { useState, useEffect } from 'react'
import { getRoleById } from '../api'
import type { Role } from '../model/types'

interface RoleDetailModalProps {
    open: boolean
    onClose: () => void
    role: Role | null
    permissions: Record<string, { id: number; name: string }[]>
}

export default function RoleDetailModal({ open, onClose, role, permissions }: RoleDetailModalProps) {
    const [roleDetail, setRoleDetail] = useState<Role | null>(null)
    const [loading, setLoading] = useState(false)

    // Load role detail when role changes
    useEffect(() => {
        const loadRoleDetail = async () => {
            if (role && open) {
                try {
                    setLoading(true)
                    const detail = await getRoleById(role.roleId)
                    setRoleDetail(detail)
                } catch (error) {
                    // Fallback to basic role data
                    setRoleDetail(role)
                } finally {
                    setLoading(false)
                }
            }
        }
        
        loadRoleDetail()
    }, [role, open])

    if (!open || !role) return null

    const displayRole = roleDetail || role

    // Get selected permissions for display
    const selectedPermissions: { group: string; permissions: string[] }[] = []
    if (displayRole.permissionIds && displayRole.permissionIds.length > 0) {
        Object.entries(permissions).forEach(([group, perms]) => {
            const groupPermissions = perms
                .filter(p => displayRole.permissionIds?.includes(p.id))
                .map(p => p.name)
            if (groupPermissions.length > 0) {
                selectedPermissions.push({ group, permissions: groupPermissions })
            }
        })
    }

    return (
        <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/30" onClick={onClose} />
            <div className="fixed inset-0 flex items-start justify-center pt-12 px-4">
                <div className="w-full max-w-2xl rounded-lg bg-white shadow-lg border max-h-[85vh] overflow-auto">
                    <div>
                        <div className="px-4 py-3 border-b flex items-center justify-between">
                            <div className="font-medium">Thông tin vai trò</div>
                            <button className="h-8 w-8 rounded hover:bg-gray-100" onClick={onClose}>×</button>
                        </div>
                        <div className="p-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="text-sm text-gray-500">Đang tải thông tin vai trò...</div>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                                        <div><div className="text-gray-500 text-xs">Tên vai trò</div><div>{displayRole.name}</div></div>
                                        <div><div className="text-gray-500 text-xs">Mã vai trò</div><div>{displayRole.code}</div></div>
                                        <div><div className="text-gray-500 text-xs">Người dùng</div><div>{displayRole.userCount}</div></div>
                                        <div><div className="text-gray-500 text-xs">Trạng thái</div><div>{displayRole.active ? 'Hoạt động' : 'Không hoạt động'}</div></div>
                                        <div className="col-span-2"><div className="text-gray-500 text-xs">Ngày tạo</div><div>{new Date(displayRole.createdAt).toLocaleDateString('vi-VN')}</div></div>
                                        {displayRole.updatedAt && (
                                            <div className="col-span-2"><div className="text-gray-500 text-xs">Ngày cập nhật</div><div>{new Date(displayRole.updatedAt).toLocaleDateString('vi-VN')}</div></div>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <div className="text-gray-500 text-xs mb-3">Quyền hạn được phân</div>
                                        {selectedPermissions.length === 0 ? (
                                            <div className="text-sm text-gray-500 italic">Chưa có quyền nào được phân cho vai trò này</div>
                                        ) : (
                                            <div className="space-y-4">
                                                {selectedPermissions.map(({ group, permissions: groupPerms }) => (
                                                    <div key={group} className="rounded-xl border border-gray-200">
                                                        <div className="px-3 py-2 text-sm font-medium border-b border-gray-200 bg-gray-50">
                                                            <span>{group}</span>
                                                            <span className="text-xs text-gray-500 ml-2">({groupPerms.length} quyền)</span>
                                                        </div>
                                                        <div className="p-3">
                                                            <div className="flex flex-wrap gap-2">
                                                                {groupPerms.map((permName, i) => (
                                                                    <span key={`${group}-${permName}-${i}`} className="text-xs font-medium px-2 py-1 rounded-md bg-indigo-100 text-indigo-700">
                                                                        {permName}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="px-4 py-3 border-t flex items-center justify-end">
                            <button className="h-9 px-3 rounded-md border bg-white hover:bg-gray-50" onClick={onClose}>Đóng</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
