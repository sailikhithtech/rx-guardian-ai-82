import { Card, CardContent } from '@/components/ui/card';
import { Calendar, DollarSign, Users, Star } from 'lucide-react';

export default function DoctorAnalytics() {
  const stats = [
    { icon: Calendar, label: 'Appointments This Month', value: '0', color: 'text-primary' },
    { icon: DollarSign, label: 'Earnings This Month', value: '₹0', color: 'text-emerald-500' },
    { icon: Users, label: 'New Patients', value: '0', color: 'text-blue-500' },
    { icon: Star, label: 'Average Rating', value: '—', color: 'text-amber-500' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Analytics charts will appear as you get more appointments</p>
        </CardContent>
      </Card>
    </div>
  );
}
