import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Plus } from 'lucide-react';

export default function DoctorPrescriptions() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Prescriptions</h1>
        <Button><Plus className="w-4 h-4 mr-1" /> New Prescription</Button>
      </div>

      <Card className="text-center py-16">
        <CardContent>
          <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">No prescriptions issued yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Write your first digital prescription</p>
          <Button className="mt-4"><Plus className="w-4 h-4 mr-1" /> Create Prescription</Button>
        </CardContent>
      </Card>
    </div>
  );
}
