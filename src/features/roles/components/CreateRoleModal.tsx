import React, { useState } from 'react'
import { createRole, transformFormDataToCreateRequest } from '../api'
import type { RoleFormData } from '../model/types'

interface CreateRoleModalProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
    permissions: Record<string, { id: number; name: string }[]>
}

export default function CreateRoleModal({ open, onClose, onSuccess, permissions }: CreateRoleModalProps) {
    const [errors, setErrors] = useState<{ name?: string; code?: string; permissions?: string }>({})
    const [selected, setSelected] = useState<Set<number>>(new Set())
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        active: true,
    })

    function togglePermission(id: number) {
        setSelected(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id); else next.add(id)
            return next
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

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

            const createRequest = transformFormDataToCreateRequest(roleFormData)
            await createRole(createRequest)

            onSuccess()
            onClose()
        } catch (error) {
            setErrors({ name: 'Có lỗi xảy ra khi tạo vai trò' })
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/30" onClick={onClose} />
            <div className="fixed inset-0 flex items-start justify-center pt-12 px-4">
                <div className="w-full max-w-2xl rounded-lg bg-white shadow-lg border max-h-[85vh] overflow-auto">
                    <form onSubmit={handleSubmit}>
                        <div className="px-4 py-3 border-b flex items-center justify-between">
                            <div className="font-medium">Tạo vai trò mới</div>
                            <button type="button" className="h-8 w-8 rounded hover:bg-gray-100" onClick={onClose}>×</button>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </div>
                        <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
                            <button type="button" className="h-9 px-3 rounded-md border bg-white hover:bg-gray-50" onClick={onClose}>Hủy</button>
                            <button type="submit" className="h-9 px-3 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Tạo vai trò</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
