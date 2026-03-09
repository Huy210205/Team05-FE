import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Edit, Ellipsis, Users, GraduationCap } from 'lucide-react';
import React from 'react';

interface ClassActionsProps {
    onEdit?: () => void;
    onManageStudents?: () => void;
    onAssignInstructor?: () => void;
}

const ClassActions: React.FC<ClassActionsProps> = ({ onEdit, onManageStudents, onAssignInstructor }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className="h-8 w-8 rounded hover:bg-gray-100 flex items-center justify-center"
                onClick={(e) => {
                    e.stopPropagation();
                }}
            >
                <Ellipsis size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
                <DropdownMenuGroup>
                    <DropdownMenuItem onClick={onEdit}>
                        <Edit size={14} />
                        <span>Chỉnh sửa</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onManageStudents}>
                        <Users size={14} />
                        <span>Quản lý học viên</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onAssignInstructor}>
                        <GraduationCap size={14} />
                        <span>Phân công giảng viên</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default ClassActions;
