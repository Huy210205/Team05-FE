import { useState, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
import { getRoles } from '../../../shared/api/roles'
import { getCentersLite } from '../../../shared/api/centers'
import { getUserView, assignRolesBatch, revokeUserRolesBulk, revokeUserRole, getRevokedRolesByUserId } from '../../../api/user'
import { useToast } from '../../../shared/hooks/useToast'
import ConfirmDialog from '../../../shared/components/ConfirmDialog'
import type { UserViewDto, UserAssignment } from '../../../shared/types/userView'
import type { RoleDto } from '../../../shared/types/role'
import type { CenterLiteDto } from '../../../shared/types/centers'

const ALL_CENTERS_VALUE = "__ALL__" as const

interface AssignRoleModalProps {
  userId: number
  onClose: () => void
  onSuccess?: () => void // Callback after successful role assignment/revocation
}

interface ExistingAssignment {
  assignmentId: number
  roleId: number
  roleName: string
  scope: 'GLOBAL' | 'CENTER'
  centerId: number | null
  centerName: string | null
  // vẫn giữ uniqueKey để làm key render
  uniqueKey: string
}

interface DraftAssignment {
  roleId?: number
  centerId?: number | null | '__ALL__'
  scope?: 'GLOBAL' | 'CENTER'
}

export default function AssignRoleModal({ userId, onClose, onSuccess }: AssignRoleModalProps) {
  const toast = useToast()
  const [roles, setRoles] = useState<RoleDto[]>([])
  const [centers, setCenters] = useState<CenterLiteDto[]>([])
  const [loading, setLoading] = useState(false)
  const [userView, setUserView] = useState<UserViewDto | null>(null)

  // ✅ sửa: marked lưu ID thật để revoke
  const [existing, setExisting] = useState<ExistingAssignment[]>([])
  const [marked, setMarked] = useState<Set<number>>(new Set())
  const [drafts, setDrafts] = useState<DraftAssignment[]>([])
  // Track revoked roles to prevent re-assignment
  const [revokedRoles, setRevokedRoles] = useState<Array<{ roleId: number; centerId: number | null }>>([])

  const [errors, setErrors] = useState<{ global?: string; drafts?: string[] }>({})
  
  // Confirm dialog state - chỉ cho hủy gán
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false)

  // Load data khi modal mở
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [userViewRes, rolesRes, centersRes, revokedRes] = await Promise.all([
          getUserView(userId),
          getRoles(true),
          getCentersLite(),
          getRevokedRolesByUserId(userId).catch(() => ({ data: [] })) // Fail silently if no access
        ])

        // Chuẩn hóa roles data structure
        let rolesData: RoleDto[] = []
        if (Array.isArray(rolesRes.data)) {
          rolesData = rolesRes.data
        } else if (rolesRes.data && typeof rolesRes.data === 'object') {
          const dataObj = rolesRes.data as any
          if (Array.isArray(dataObj.roles)) rolesData = dataObj.roles
          else if (Array.isArray(dataObj.data)) rolesData = dataObj.data
          else if (Array.isArray(dataObj.items)) rolesData = dataObj.items
        }

        setRoles(rolesData)
        setCenters(Array.isArray(centersRes.data) ? centersRes.data : [])
        setUserView(userViewRes.data)

        // ✅ sửa: map đúng assignmentId từ API
        if (userViewRes.data.assignments && userViewRes.data.assignments.length > 0) {
          const ex: ExistingAssignment[] = userViewRes.data.assignments.map((a: UserAssignment) => {
            const role = rolesData.find((r: RoleDto) => r.roleId === a.roleId)
            const center = (Array.isArray(centersRes.data) ? centersRes.data : []).find(
              (c: CenterLiteDto) => c.centerId === a.centerId
            )
            const uniqueKey = `${a.roleId}-${a.centerId ?? 'null'}-${a.scope}`

            return {
              assignmentId: (a as any).assignmentId ?? (a as any).userRoleId, // 👈 lấy ID thật
              roleId: a.roleId,
              roleName: role?.name || a.roleName || 'Unknown Role',
              scope: a.scope,
              centerId: a.centerId,
              centerName: center?.name ?? a.centerName ?? null,
              uniqueKey,
            }
          })
          setExisting(ex)
        } else {
          setExisting([])
        }

        // ✅ Load revoked roles to prevent re-assignment
        const revokedData = Array.isArray(revokedRes.data) ? revokedRes.data : []
        const revokedRolesList = revokedData.map((r: any) => ({
          roleId: r.role?.roleId || r.roleId,
          centerId: r.center?.centerId ?? (r.centerId ?? null)
        }))
        setRevokedRoles(revokedRolesList)

        // Reset state
        setMarked(new Set())
        setDrafts([])
        setErrors({})
      } catch (error) {
        toast.error('Lỗi', 'Không thể tải dữ liệu người dùng')
      } finally {
        setLoading(false)
      }
    }

    if (userId) loadData()
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Helper: check if role is global (SUPER_ADMIN or TRAINING_MANAGER)
  const isGlobalRole = (roleId?: number) => {
    if (!roleId) return false
    const role = roles.find(r => r.roleId === roleId)
    // Check by code first (more reliable), fallback to scope
    if (role?.code === 'SUPER_ADMIN' || role?.code === 'TRAINING_MANAGER') {
      return true
    }
    return role?.scope === 'GLOBAL'
  }

  // Helper: check if a role-center combo was revoked (cannot be re-assigned)
  const isRevoked = (roleId?: number, centerId?: number | null | '__ALL__') => {
    if (!roleId) return false
    
    // For "All Centers" option, check if this role was revoked for any center
    if (centerId === ALL_CENTERS_VALUE) {
      // Check if this role was revoked at any specific center
      return revokedRoles.some(r => r.roleId === roleId && r.centerId !== null)
    }
    
    // For specific center (or null for GLOBAL), check exact match
    const normalizedCenterId = centerId === null || centerId === undefined ? null : centerId
    return revokedRoles.some(r => 
      r.roleId === roleId && 
      (r.centerId === normalizedCenterId || (r.centerId === null && normalizedCenterId === null))
    )
  }

  // ✅ sửa: toggle theo assignmentId
  const toggleRemoval = (assignmentId: number) => {
    setMarked(prev => {
      const next = new Set(prev)
      next.has(assignmentId) ? next.delete(assignmentId) : next.add(assignmentId)
      return next
    })
  }

  // Thêm hàng mới
  const addNewRow = () => {
    setDrafts(prev => [...prev, {}])
    setErrors({})
  }

  // Xóa hàng mới
  const removeNewRow = (index: number) => {
    setDrafts(prev => prev.filter((_, i) => i !== index))
    setErrors({})
  }

  // Cập nhật hàng mới
  const updateDraft = (index: number, field: 'roleId' | 'centerId', value: number | null | '__ALL__') => {
    setDrafts(prev => prev.map((draft, i) => {
      if (i !== index) return draft

      if (field === 'roleId') {
        const roleId = value as number
        const isGlobal = isGlobalRole(roleId)
        const newCenterId = isGlobal ? null : draft.centerId

        // Check if this role-center combo is revoked
        if (roleId && isRevoked(roleId, newCenterId)) {
          // Don't allow selecting revoked role
          toast.error('Lỗi', 'Không thể gán lại vai trò này vì đã từng bị hủy gán trước đó')
          return draft // Keep current state
        }

        return {
          ...draft,
          roleId: roleId ?? undefined,
          // Auto-set to "All Centers" if global role
          centerId: newCenterId,
          scope: isGlobal ? 'GLOBAL' : 'CENTER'
        }
      }

      if (field === 'centerId') {
        const newCenterId = value
        // If role is already selected, check if it's revoked for the new center
        if (draft.roleId && isRevoked(draft.roleId, newCenterId)) {
          // Clear the role if it's revoked for this center
          return { ...draft, centerId: newCenterId, roleId: undefined }
        }
        return { ...draft, centerId: newCenterId }
      }

      return draft
    }))
    setErrors({})
  }

  // Validation đơn giản
  const validate = () => {
    const newErrors: { global?: string; drafts?: string[] } = { drafts: [] }

    drafts.forEach((draft, idx) => {
      if (!draft.roleId) {
        newErrors.drafts![idx] = 'Vui lòng chọn vai trò'
      } else {
        const isGlobal = isGlobalRole(draft.roleId)
        // ✅ CENTER role: phải có centerId (có thể là số hoặc '__ALL__')
        if (!isGlobal && !draft.centerId && draft.centerId !== ALL_CENTERS_VALUE) {
          newErrors.drafts![idx] = 'Vui lòng chọn trung tâm'
        }
      }
    })

    setErrors(newErrors)
    return !newErrors.global && (!newErrors.drafts || newErrors.drafts.filter(Boolean).length === 0)
  }

  // Có thay đổi?
  const hasChanges = () => {
    return marked.size > 0 || (drafts.length > 0 && drafts.every(d => d.roleId))
  }

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!hasChanges()) {
      toast.error('Lỗi', 'Không có thay đổi nào')
      return
    }

    if (!validate()) return

    // Nếu có hủy gán → hiển thị confirm dialog
    if (marked.size > 0) {
      setShowRevokeConfirm(true)
      return
    }

    // Nếu chỉ có gán vai trò mới → thực hiện luôn
    await executeSubmit()
  }

  // Thực hiện submit thực sự
  const executeSubmit = async () => {
    try {
      // ✅ Revoke theo ID thật
      if (marked.size > 0) {
        const ids = Array.from(marked)
        try {
          await revokeUserRolesBulk(ids) // SA bulk
        } catch (e: any) {
          if (e?.response?.status === 403) {
            // Non-SA fallback: xóa từng cái
            await Promise.all(ids.map(id => revokeUserRole(id)))
          } else {
            throw e
          }
        }
      }

      // Assign - expand "All Centers" to multiple assignments
      const toCreate = drafts
        .filter(d => d.roleId)
        .flatMap(({ roleId, centerId, scope }) => {
          // ✅ GLOBAL role: không gửi centerId
          if (scope === 'GLOBAL') {
            return [{ roleId: roleId! }]
          }
          
          // ✅ CENTER role với "Tất cả trung tâm": tạo một assignment cho mỗi trung tâm
          if (centerId === ALL_CENTERS_VALUE) {
            return centers.map(center => ({
              roleId: roleId!,
              centerId: center.centerId
            }))
          }
          
          // ✅ CENTER role với trung tâm cụ thể
          return [{ 
            roleId: roleId!, 
            centerId: centerId ?? null 
          }]
        })

      if (toCreate.length > 0) {
        const response = await assignRolesBatch(userId, toCreate)

        // Hiển thị errors từ BE
        if (response.data.errors?.length > 0) {
          response.data.errors.forEach(error => toast.error('Lỗi', error))
        }
        if (response.data.skippedCount > 0) {
          toast.info('Thông báo', `Đã bỏ qua ${response.data.skippedCount} phân quyền trùng`)
        }
      }

      // Refetch & reset
      const userViewRes = await getUserView(userId)
      setUserView(userViewRes.data)

      // ✅ map lại existing với assignmentId thật
      const ex: ExistingAssignment[] = (userViewRes.data.assignments || []).map((a: UserAssignment) => {
        const role = roles.find((r: RoleDto) => r.roleId === a.roleId)
        const center = centers.find((c: CenterLiteDto) => c.centerId === a.centerId)
        const uniqueKey = `${a.roleId}-${a.centerId ?? 'null'}-${a.scope}`

        return {
          assignmentId: (a as any).assignmentId ?? (a as any).userRoleId,
          roleId: a.roleId,
          roleName: role?.name || a.roleName || 'Unknown Role',
          scope: a.scope,
          centerId: a.centerId,
          centerName: center?.name ?? a.centerName ?? null,
          uniqueKey,
        }
      })
      setExisting(ex)
      setMarked(new Set())
      setDrafts([])
      setErrors({})

      toast.success('Thành công', 'Cập nhật vai trò thành công')
      // Call onSuccess callback to refresh parent data (e.g., dashboard stats)
      if (onSuccess) onSuccess()
      onClose()
    } catch (error: any) {
      toast.error('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật vai trò')
    }
  }

  if (!userView) return null

  return (
    <>
      {/* Confirm Dialog - chỉ cho hủy gán */}
      <ConfirmDialog
        open={showRevokeConfirm}
        onClose={() => setShowRevokeConfirm(false)}
        onConfirm={() => {
          setShowRevokeConfirm(false)
          executeSubmit()
        }}
        title="Xác nhận hủy gán vai trò"
        description={`Bạn đang hủy gán ${marked.size} vai trò.\n\n⚠️ Thao tác này không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?`}
        confirmText="Xác nhận hủy gán"
        cancelText="Hủy bỏ"
        variant="danger"
      />

      <div className="fixed inset-0 z-50">
        <div className="fixed inset-0 bg-black/30" onClick={onClose} />
        <div className="fixed inset-0 flex items-start justify-center pt-12 px-4">
        <div className="w-full max-w-4xl rounded-lg bg-white shadow-lg border max-h-[85vh] overflow-auto">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="px-6 py-4 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Cập nhật vai trò cho {userView.fullName}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-500">{userView.email || 'Chưa có email'}</span>
                    {userView.active !== undefined && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${userView.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                        }`}>
                        {userView.active ? 'Đang hoạt động' : 'Đã vô hiệu'}
                      </span>
                    )}
                  </div>
                </div>
                <button type="button" className="text-gray-400 hover:text-gray-600" onClick={onClose}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-sm text-gray-500">Đang tải dữ liệu...</div>
                </div>
              ) : (
                <>
                  {/* Error global */}
                  {errors.global && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                      {errors.global}
                    </div>
                  )}

                  {/* (A) Danh sách vai trò hiện có */}
                  {existing.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-3">Vai trò hiện có</h3>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="text-left px-4 py-2 font-medium text-gray-600">Vai trò</th>
                              <th className="text-left px-4 py-2 font-medium text-gray-600">Trung tâm</th>
                              <th className="text-left px-4 py-2 font-medium text-gray-600">Phạm vi</th>
                              <th className="text-right px-4 py-2 font-medium text-gray-600">Hành động</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {existing.map((assignment) => {
                              const isMarked = marked.has(assignment.assignmentId)
                              const isGlobal = assignment.scope === 'GLOBAL'

                              return (
                                <tr key={assignment.uniqueKey} className={isMarked ? 'bg-gray-50' : ''}>
                                  <td className={`px-4 py-3 ${isMarked ? 'line-through text-gray-400' : ''}`}>
                                    <div className="flex items-center gap-2">
                                      {assignment.roleName}
                                      {isMarked && (
                                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                                          Sẽ hủy
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className={`px-4 py-3 ${isMarked ? 'line-through text-gray-400' : ''}`}>
                                    {isGlobal || assignment.centerId === null
                                      ? <span className="text-blue-600">Tất cả trung tâm</span>
                                      : (assignment.centerName || `Center ID: ${assignment.centerId}`)
                                    }
                                  </td>
                                  <td className={`px-4 py-3 ${isMarked ? 'line-through text-gray-400' : ''}`}>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${isGlobal
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-green-100 text-green-700'
                                      }`}>
                                      {assignment.scope}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => toggleRemoval(assignment.assignmentId)}
                                      className={`text-xs px-3 py-1 rounded ${isMarked
                                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                                        }`}
                                    >
                                      {isMarked ? 'Hoàn tác' : 'Hủy gán'}
                                    </button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* (B) Gán vai trò hiện có cho trung tâm khác */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium">
                        {existing.length > 0 ? 'Gán vai trò hiện có cho trung tâm khác' : 'Khôi phục vai trò đã bị hủy gán'}
                      </h3>
                      {(existing.length > 0 || revokedRoles.length > 0) && (
                        <button
                          type="button"
                          onClick={addNewRow}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          + Thêm phân quyền
                        </button>
                      )}
                    </div>

                    {existing.length === 0 && revokedRoles.length === 0 ? (
                      <div className="border-2 border-dashed rounded-lg p-6 text-center text-gray-400 text-sm">
                        Người dùng chưa có vai trò nào. Vui lòng liên hệ quản trị viên để gán vai trò mới.
                      </div>
                    ) : drafts.length === 0 ? (
                      <div className="border-2 border-dashed rounded-lg p-6 text-center text-gray-400 text-sm">
                        {existing.length > 0 
                          ? 'Nhấn "+ Thêm phân quyền" để gán vai trò hiện có cho trung tâm khác'
                          : 'Nhấn "+ Thêm phân quyền" để khôi phục vai trò gốc (vai trò đã bị hủy gán)'}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {drafts.map((draft, idx) => {
                          // Lấy vai trò từ existing hoặc revoked roles
                          let fixedRoleId: number
                          let fixedRoleName: string
                          let isGlobal: boolean

                          if (existing.length > 0) {
                            // Có vai trò hiện tại → dùng vai trò đầu tiên
                            const defaultRole = existing[0]
                            fixedRoleId = defaultRole.roleId
                            fixedRoleName = defaultRole.roleName
                            isGlobal = defaultRole.scope === 'GLOBAL'
                          } else if (revokedRoles.length > 0) {
                            // Không còn vai trò hiện tại → lấy từ revoked roles
                            const revokedRoleId = revokedRoles[0].roleId
                            const revokedRole = roles.find(r => r.roleId === revokedRoleId)
                            fixedRoleId = revokedRoleId
                            fixedRoleName = revokedRole?.name || `Role ID: ${revokedRoleId}`
                            isGlobal = revokedRole?.scope === 'GLOBAL' || false
                          } else {
                            // Fallback (không nên xảy ra)
                            return null
                          }

                          return (
                            <div key={idx} className="border rounded-lg p-4">
                              <div className="flex gap-3 items-start">
                                {/* Role display (read-only) */}
                                <div className="flex-1">
                                  <label className="block text-xs text-gray-600 mb-1">Vai trò</label>
                                  <div className="w-full h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm flex items-center text-gray-700 font-medium">
                                    {fixedRoleName}
                                    <span className="ml-2 text-xs text-gray-500">(Không thể thay đổi)</span>
                                  </div>
                                </div>

                                {/* Center select */}
                                <div className="flex-1">
                                  <label className="block text-xs text-gray-600 mb-1">Trung tâm *</label>
                                  {isGlobal ? (
                                    <div className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm flex items-center text-gray-900 font-medium">
                                      Tất cả trung tâm
                                    </div>
                                  ) : (
                                    <>
                                      <select
                                        value={draft.centerId === null ? '' : draft.centerId}
                                        onChange={(e) => {
                                          const val = e.target.value
                                          // Tự động set roleId khi chọn center
                                          setDrafts(prev => prev.map((d, i) => 
                                            i === idx 
                                              ? { 
                                                  roleId: fixedRoleId,
                                                  centerId: val === ALL_CENTERS_VALUE ? ALL_CENTERS_VALUE : (val ? Number(val) : null),
                                                  scope: 'CENTER'
                                                }
                                              : d
                                          ))
                                        }}
                                        className={`w-full h-10 rounded-lg border px-3 text-sm ${errors.drafts?.[idx] ? 'border-red-500' : 'border-gray-300'
                                          }`}
                                      >
                                        <option value="">-- Chọn trung tâm --</option>
                                        <option value={ALL_CENTERS_VALUE}>Tất cả trung tâm ({centers.length})</option>
                                        {centers.map(center => (
                                          <option key={center.centerId} value={center.centerId}>
                                            {center.name}
                                          </option>
                                        ))}
                                      </select>
                                      {draft.centerId === ALL_CENTERS_VALUE && (
                                        <div className="mt-1 text-xs text-gray-600">
                                          Vai trò này sẽ được gán cho {centers.length} trung tâm
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>

                                {/* Remove button */}
                                <div>
                                  <label className="block text-xs text-transparent mb-1">-</label>
                                  <button
                                    type="button"
                                    onClick={() => removeNewRow(idx)}
                                    className="h-10 w-10 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-600 flex items-center justify-center"
                                    title="Xóa"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Error message */}
                              {errors.drafts?.[idx] && (
                                <div className="mt-2 text-xs text-red-600">
                                  {errors.drafts[idx]}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="text-xs text-gray-500">
                GLOBAL chỉ hiển thị "Tất cả trung tâm"
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading || !hasChanges()}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#030213] rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cập nhật vai trò
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      </div>
    </>
  )
}
