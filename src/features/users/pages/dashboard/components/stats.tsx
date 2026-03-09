import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatItem {
    label: string;
    value: string;
    sub: string;
    change?: string | null;
    changeType: 'positive' | 'negative' | 'neutral';
    icon: React.ComponentType<{ size?: number }>;
    iconColor: string;
    bgGradient: string;
    glowColor: string;
    onClick?: () => void;
}

interface StatsProps {
    stats: StatItem[];
    isLoaded: boolean;
}

const Stats: React.FC<StatsProps> = ({ stats, isLoaded }) => {
    return (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((s, index) => {
                const IconComponent = s.icon;
                return (
                    <button
                        key={s.label}
                        type="button"
                        onClick={s.onClick}
                        aria-label={s.label}
                        className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.bgGradient} p-6 border border-white/20 transition-all duration-500 ${s.glowColor} hover:scale-105 hover:shadow-2xl hover:shadow-xl bg-white text-left focus:outline-none ${s.onClick ? 'cursor-pointer' : ''}`}
                        style={{
                            animationDelay: `${index * 100}ms`,
                            animation: isLoaded ? 'fadeInUp 0.6s ease-out forwards' : 'none',
                        }}
                    >
                        {/* Animated background pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-2xl"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/10 to-transparent rounded-full blur-xl"></div>
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                                <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide whitespace-nowrap">
                                    {s.label}
                                </div>
                                <div
                                    className={`h-10 w-10 rounded-xl bg-gradient-to-br ${s.iconColor} grid place-items-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                                >
                                    <IconComponent size={18} />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">
                                {s.value}
                            </div>
                            <div className="text-sm text-gray-600 mb-4 whitespace-nowrap">{s.sub}</div>
                            {s.change && (
                                <div
                                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                                        s.changeType === 'positive'
                                            ? 'text-green-700 bg-green-100 hover:bg-green-200'
                                            : s.changeType === 'negative'
                                              ? 'text-red-700 bg-red-100 hover:bg-red-200'
                                              : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                                    }`}
                                >
                                    {s.changeType === 'positive' ? (
                                        <TrendingUp size={12} />
                                    ) : s.changeType === 'negative' ? (
                                        <TrendingDown size={12} />
                                    ) : null}
                                    {s.change}
                                </div>
                            )}
                        </div>
                    </button>
                );
            })}
        </section>
    );
};

export default Stats;
