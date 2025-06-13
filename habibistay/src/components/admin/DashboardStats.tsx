'use client';

// Placeholder icon components since we're having issues with react-icons
const IconComponent = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <span className={`inline-block ${className || ''}`} style={{ width: '1em', height: '1em' }}>{children}</span>
);

const FaUsers = ({ className }: { className?: string }) => <IconComponent className={className}>👥</IconComponent>;
const FaBuilding = ({ className }: { className?: string }) => <IconComponent className={className}>🏢</IconComponent>;
const FaCalendarAlt = ({ className }: { className?: string }) => <IconComponent className={className}>📅</IconComponent>;
const FaDollarSign = ({ className }: { className?: string }) => <IconComponent className={className}>💲</IconComponent>;
const FaClock = ({ className }: { className?: string }) => <IconComponent className={className}>⏰</IconComponent>;
const FaPlane = ({ className }: { className?: string }) => <IconComponent className={className}>✈️</IconComponent>;

interface DashboardStatsProps {
  stats: {
    totalUsers: number;
    totalProperties: number;
    totalBookings: number;
    totalRevenue: number;
    pendingBookings: number;
    upcomingBookings: number;
  };
}

const DashboardStats = ({ stats }: DashboardStatsProps) => {
  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: FaUsers,
      color: 'bg-blue-500',
      iconColor: 'text-blue-200',
      link: '/admin/users',
    },
    {
      title: 'Total Properties',
      value: stats.totalProperties,
      icon: FaBuilding,
      color: 'bg-green-500',
      iconColor: 'text-green-200',
      link: '/admin/properties',
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: FaCalendarAlt,
      color: 'bg-purple-500',
      iconColor: 'text-purple-200',
      link: '/admin/bookings',
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: FaDollarSign,
      color: 'bg-yellow-500',
      iconColor: 'text-yellow-200',
      link: '/admin/payments',
    },
    {
      title: 'Pending Bookings',
      value: stats.pendingBookings,
      icon: FaClock,
      color: 'bg-red-500',
      iconColor: 'text-red-200',
      link: '/admin/bookings?status=PENDING',
    },
    {
      title: 'Upcoming Bookings',
      value: stats.upcomingBookings,
      icon: FaPlane,
      color: 'bg-indigo-500',
      iconColor: 'text-indigo-200',
      link: '/admin/bookings?upcoming=true',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
          <div className={`${card.color} p-4 text-white flex items-center justify-between`}>
            <div>
              <h3 className="text-lg font-medium">{card.title}</h3>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
            </div>
            <div className={`text-3xl ${card.iconColor}`}>
              <card.icon />
            </div>
          </div>
          <div className="p-4 bg-gray-50 text-right">
            <a 
              href={card.link} 
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View Details &rarr;
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
