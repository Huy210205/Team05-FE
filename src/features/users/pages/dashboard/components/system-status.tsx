import React from 'react';
import { Building2, Users, BookOpen } from 'lucide-react';

interface SystemService {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  status: string;
  color: string;
}

interface SystemStatusProps {
  services: SystemService[];
  isLoaded: boolean;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ services, isLoaded }) => {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50/30 p-8 border border-gray-200/50 bg-white">
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-blue-500/5 to-purple-500/5"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              Trạng thái hệ thống
            </h3>
            <p className="text-sm text-gray-600">
              Tình trạng hoạt động của các dịch vụ với hiệu ứng real-time
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-xl">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="font-semibold">Tất cả hoạt động bình thường</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <div
                key={service.label}
                className="group relative overflow-hidden flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 hover:shadow-lg transition-all duration-300 hover:scale-105"
                style={{
                  animationDelay: `${index * 200}ms`,
                  animation: isLoaded ? 'fadeInUp 0.6s ease-out forwards' : 'none',
                }}
              >
                <div
                  className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${service.color} grid place-items-center text-white group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                >
                  <IconComponent size={20} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900 group-hover:text-gray-800 transition-colors">
                    {service.label}
                  </div>
                  <div className="text-xs text-green-600 font-medium flex items-center gap-1 mt-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    {service.status}
                  </div>
                </div>

                {/* Animated pulse effect */}
                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-green-500 animate-ping opacity-75"></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SystemStatus;
