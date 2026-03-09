import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, Ellipsis, Eye, UserMinus, UserCheck, GraduationCap } from 'lucide-react';
import React from 'react';

interface StudentActionsProps {
    onView?: () => void;
    onEdit?: () => void;
    onChangeStatus?: () => void;
    onRemove?: () => void;
}

const StudentActions: React.FC<StudentActionsProps> = ({ 
    onView, 
    onEdit, 
    onChangeStatus, 
    onRemove 
}) => {
  return (
      <DropdownMenu>
          <DropdownMenuTrigger className="h-8 w-8 rounded hover:bg-gray-100 flex items-center justify-center">
              <Ellipsis size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
              <DropdownMenuGroup>
                  <DropdownMenuItem onClick={onView}>
                      <Eye size={14} />
                      <span>Xem chi tiết</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onEdit}>
                      <Edit size={14} />
                      <span>Chỉnh sửa</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onChangeStatus}>
                      <UserCheck size={14} />
                      <span>Thay đổi trạng thái</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                      onClick={onRemove}
                      className="text-red-600"
                  >
                      <UserMinus size={14} />
                      <span>Xóa khỏi hệ thống</span>
                  </DropdownMenuItem>
              </DropdownMenuGroup>
          </DropdownMenuContent>
      </DropdownMenu>
  )
}

export default StudentActions;
