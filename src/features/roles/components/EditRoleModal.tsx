import React, { useState, useEffect } from 'react'
import { updateRole, transformFormDataToUpdateRequest, getRoleById } from '../api'
import type { Role, RoleFormData } from '../model/types'

interface EditRoleModalProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
    role: Role | null
    permissions: Record<string, { id: number; name: string }[]>
}

export default function EditRoleModal({ open, onClose, onSuccess, role, permissions }: EditRoleModalProps) {
    const [errors, setErrors] = useState<{ name?: string; code?: string; permissions?: string }>({})
    const [selected, setSelected] = useState<Set<number>>(new Set())
    const [loading, setLoading] = useState(false)
    const [roleDetail, setRoleDetail] = useState<Role | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        active: true,
    })

    // Load role detail when role changes
    useEffect(() => {
        const loadRoleDetail = async () => {
            if (role && open) {
                try {
                    setLoading(true)
                    const detail = await getRoleById(role.roleId)
                    setRoleDetail(detail)
                    setFormData({
                        name: detail.name,
                        code: detail.code,
                        active: detail.active,
                    })
                    setSelected(new Set(detail.permissionIds || []))
                } catch (error) {
                    // Fallback to basic role data
                    setRoleDetail(role)
                    setFormData({
                        name: role.name,
                        code: role.code,
                        active: role.active,
                    })
                    setSelected(new Set(role.permissionIds || []))
                } finally {
                    setLoading(false)
                }
            }
        }
        
        loadRoleDetail()
    }, [role, open])

    function togglePermission(id: number) {
        setSelected(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id); else next.add(id)
            return next
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!roleDetail) return

        // validations
        const newErrors: typeof errors = {}
        if (!formData.name || formData.name.trim().length < 3) newErrors.name = 'Tên vai trò tối thiểu 3 ký tự'
        if (!formData.code || formData.code.trim().length < 2) newErrors.code = 'Mã vai trò tối thiểu 2 ký tự'
        if (selected.size === 0) newErrors.permissions = 'Chọn ít nhất 1 quyền'
        setErrors(newErrors)
        if (Object.keys(newErrors).length > 0) return

        try {
            const roleFormData: RoleFormData = {
                name: formData.name,
                code: formData.code,
                active: formData.active,
                permissionIds: Array.from(selected),
            }

            const updateRequest = transformFormDataToUpdateRequest(roleDetail.roleId, roleFormData)
            await updateRole(roleDetail.roleId, updateRequest)

            onSuccess()
            onClose()
        } catch (error) {
            setErrors({ name: 'Có lỗi xảy ra khi cập nhật vai trò' })
        }
    }

    if (!open || !role) return null

    return (
        <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/30" onClick={onClose} />
            <div className="fixed inset-0 flex items-start justify-center pt-12 px-4">
                <div className="w-full max-w-2xl rounded-lg bg-white shadow-lg border max-h-[85vh] overflow-auto">
                    <form onSubmit={handleSubmit}>
                        <div className="px-4 py-3 border-b flex items-center justify-between">
                            <div className="font-medium">Chỉnh sửa vai trò</div>
                            <button type="button" className="h-8 w-8 rounded hover:bg-gray-100" onClick={onClose}>×</button>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {loading ? (
                                <div className="md:col-span-2 flex items-center justify-center py-8">
                                    <div className="text-sm text-gray-500">Đang tải thông tin vai trò...</div>
                                </div>
                            ) : (
                                <>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Tên vai trò *</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className={`w-full h-9 rounded-md border px-3 text-sm ${errors.name ? 'border-red-500' : ''}`}
                                    placeholder="Giáo vụ"
                                />
                                {errors.name && <div className="text-xs text-red-600 mt-1">{errors.name}</div>}
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Mã vai trò *</label>
                                <input
                                    name="code"
                                    value={formData.code}
                                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                                    className={`w-full h-9 rounded-md border px-3 text-sm ${errors.code ? 'border-red-500' : ''}`}
                                    placeholder="VD: GV, TP, QLT"
                                />
                                {errors.code && <div className="text-xs text-red-600 mt-1">{errors.code}</div>}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs text-gray-600 mb-2">Phân quyền</label>
                                {Object.entries(permissions).map(([group, items]) => {
                                    const count = items.filter(p => selected.has(p.id)).length
                                    return (
                                        <div key={group} className="mb-3 rounded-xl border border-gray-200">
                                            <div className="px-3 py-2 text-sm font-medium flex items-center justify-between">
                                                <span>{group}</span>
                                                <span className="text-xs text-gray-500">{count}/{items.length}</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
                                                {items.map(permission => (
                                                    <label key={permission.id} className={`rounded-lg border ${selected.has(permission.id) ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-200'} bg-white p-3 flex items-start gap-2 cursor-pointer`}>
                                                        <input type="checkbox" className="mt-0.5" checked={selected.has(permission.id)} onChange={() => togglePermission(permission.id)} />
                                                        <div>
                                                            <div className="text-sm font-medium">{permission.name}</div>
                                                            <div className="text-xs text-gray-500">
                                                                {permission.name.includes('Xem') ? 'Quyền xem thông tin' :
                                                                    permission.name.includes('Tạo') ? 'Quyền tạo mới' :
                                                                        permission.name.includes('Chỉnh sửa') ? 'Quyền chỉnh sửa thông tin' :
                                                                            permission.name.includes('Xóa') ? 'Quyền xóa dữ liệu' :
                                                                                permission.name.includes('Quản lý') ? 'Quyền quản lý toàn diện' :
                                                                                    permission.name.includes('Gán') ? 'Quyền gán vai trò' :
                                                                                        'Quyền hệ thống'}
                                                            </div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                                {errors.permissions && <div className="text-xs text-red-600 mt-1">{errors.permissions}</div>}
                            </div>
                                </>
                            )}
                        </div>
                        <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
                            <button type="button" className="h-9 px-3 rounded-md border bg-white hover:bg-gray-50" onClick={onClose}>Hủy</button>
                            <button type="submit" disabled={loading} className="h-9 px-3 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
                                {loading ? 'Đang tải...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
