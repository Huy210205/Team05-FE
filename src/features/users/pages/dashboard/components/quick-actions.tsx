import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Star } from 'lucide-react';

interface QuickAction {
    label: string;
    color: string;
    icon: LucideIcon;
    onClick?: () => void;
}

interface QuickActionsProps {
    actions: QuickAction[];
    isLoaded: boolean;
}

const QuickActions: React.FC<QuickActionsProps> = ({ actions, isLoaded }) => {
    return (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50/50 p-8 border border-gray-200/50 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500" />
                            Thao tác nhanh
                        </h3>
                        <p className="text-sm text-gray-600">Các chức năng thường dùng với hiệu ứng đẹp mắt</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {actions.map((action, index) => {
                        const IconComponent = action.icon;
                        return (
                            <button
                                key={action.label}
                                onClick={action.onClick}
                                className="group relative flex flex-col items-center gap-4 p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:border-gray-300/50 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                                style={{
                                    animationDelay: `${index * 150}ms`,
                                    animation: isLoaded ? 'fadeInUp 0.6s ease-out forwards' : 'none',
                                }}
                            >
                                {/* Hover effect background */}
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>

                                <div
                                    className={`relative z-10 h-14 w-14 rounded-2xl ${action.color} grid place-items-center text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}
                                >
                                    <IconComponent size={24} />
                                </div>
                                <span className="relative z-10 text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                                    {action.label}
                                </span>

                                {/* Shine effect */}
                                <div className="absolute inset-0 -top-2 -left-2 w-8 h-8 bg-gradient-to-br from-white/60 to-transparent rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300 pointer-events-none"></div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default QuickActions;
