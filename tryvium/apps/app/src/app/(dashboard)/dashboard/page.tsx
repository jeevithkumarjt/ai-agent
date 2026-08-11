import { Card, CardContent, CardHeader, CardTitle } from '@tryvium/ui'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-brand-600">Total Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-brand-900">12,483</p>
            <p className="mt-1 text-xs text-green-600">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-brand-600">Resolution Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-brand-900">94.2%</p>
            <p className="mt-1 text-xs text-green-600">+2.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-brand-600">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-brand-900">1.2s</p>
            <p className="mt-1 text-xs text-green-600">-0.3s from last month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: 'New conversation started', time: '2 minutes ago', status: 'active' },
              { action: 'Workflow completed: Order processing', time: '15 minutes ago', status: 'completed' },
              { action: 'AI agent escalation to human', time: '1 hour ago', status: 'escalated' },
              { action: 'New team member invited', time: '3 hours ago', status: 'pending' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-brand-100 p-4">
                <div>
                  <p className="text-sm font-medium text-brand-900">{item.action}</p>
                  <p className="text-xs text-brand-500">{item.time}</p>
                </div>
                <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-800">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
