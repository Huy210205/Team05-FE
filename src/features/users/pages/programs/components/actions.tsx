import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../../../../components/ui/dropdown-menu';
import { Eye, MoreHorizontal, ListOrdered, Pencil, Trash2 } from 'lucide-react';
import React from 'react';

interface ProgramActionsProps {
    onView?: () => void;
    onManageModules?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

const ProgramActions: React.FC<ProgramActionsProps> = ({ onView, onManageModules, onEdit, onDelete }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 rounded-md border bg-white hover:bg-gray-50 inline-flex items-center justify-center">
                <MoreHorizontal size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
                <DropdownMenuGroup>
                    {onView && (
                        <DropdownMenuItem onClick={onView}>
                            <Eye size={14} />
                            <span>Xem chi tiết</span>
                        </DropdownMenuItem>
                    )}
                    {onEdit && (
                        <DropdownMenuItem onClick={onEdit}>
                            <Pencil size={14} />
                            <span>Chỉnh sửa</span>
                        </DropdownMenuItem>
                    )}
                    {onManageModules && (
                        <DropdownMenuItem onClick={onManageModules}>
                            <ListOrdered size={14} />
                            <span>Sắp xếp modules</span>
                        </DropdownMenuItem>
                    )}
                    {onDelete && (
                        <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
                            <Trash2 size={14} />
                            <span>Xóa</span>
                        </DropdownMenuItem>
                    )}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default ProgramActions;
