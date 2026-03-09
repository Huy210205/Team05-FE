import React, { useState } from 'react';
import { Sparkles, Zap, ChevronDown, ChevronUp } from 'lucide-react';

interface Activity {
  title: string;
  desc: string;
  time: string;
  color: string;
  icon: React.ComponentType<{ size?: number }>;
  type: string;
}

interface ActivitiesProps {
  activities: Activity[];
  isLoaded: boolean;
}

const Activities: React.FC<ActivitiesProps> = ({ activities, isLoaded }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50/30 p-8 border border-gray-200/50 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-orange-500/5"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Hoạt động gần đây
            </h3>
            <p className="text-sm text-gray-600">
              Theo dõi các hoạt động mới nhất với hiệu ứng động đẹp mắt
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-4 py-2 rounded-xl">
              <Zap className="h-4 w-4" />
              <span className="font-semibold">Cập nhật real-time</span>
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors"
            >
              {isCollapsed ? (
                <>
                  <ChevronDown className="h-4 w-4" />
                  <span>Mở rộng</span>
                </>
              ) : (
                <>
                  <ChevronUp className="h-4 w-4" />
                  <span>Thu gọn</span>
                </>
              )}
            </button>
          </div>
        </div>
        <div 
          className={`space-y-4 transition-all duration-500 ease-in-out overflow-hidden ${
            isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'
          }`}
        >
          {activities.map((activity, index) => {
            const IconComponent = activity.icon;
            return (
              <div
                key={index}
                className="group relative overflow-hidden flex items-center gap-4 p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: isLoaded ? 'fadeInUp 0.6s ease-out forwards' : 'none',
                }}
              >
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 to-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div
                  className={`h-12 w-12 rounded-2xl ${activity.color} grid place-items-center text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}
                >
                  <IconComponent size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 group-hover:text-gray-800 transition-colors">
                    {activity.title}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{activity.desc}</div>
                </div>
                <div className="text-xs text-gray-500 font-medium">{activity.time}</div>

                {/* Animated pulse effect */}
                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-purple-500 animate-ping opacity-75"></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Activities;
