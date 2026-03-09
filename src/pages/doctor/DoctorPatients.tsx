import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search } from 'lucide-react';
import { useState } from 'react';

export default function DoctorPatients() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">My Patients</h1>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search patients by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="text-center py-16">
        <CardContent>
          <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">No patients yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Patient records will appear here after consultations</p>
        </CardContent>
      </Card>
    </div>
  );
}
