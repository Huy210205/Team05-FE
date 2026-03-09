import api from './http'
import type { UserViewDto, UserViewQuery, RoleStatsResponse } from '../types/userView'

// GET /api/user-views  (nhận params object)
export const listUserViews = (params: UserViewQuery = {}) =>
    api.get<UserViewDto[]>('/api/user-views', { params })

// GET /api/user-stats/roles  (nhận params object { centerId? })
export const getRoleStats = (params: { centerId?: number } = {}) =>
    api.get<RoleStatsResponse>('/api/user-stats/roles', { params })
