import { Card } from '../../components/ui/Card';

export function NotificationCenter() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notifications</h1>
      <Card>
        <p>No new notifications at this time.</p>
      </Card>
    </div>
  );
}
