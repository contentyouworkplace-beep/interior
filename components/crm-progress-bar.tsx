import { Progress } from './ui/progress'

const steps = [
  { label: 'Client/Lead Management', done: true },
  { label: 'Project Management', done: false },
  { label: 'Quotation/Invoice System', done: false },
  { label: 'Payment/Expense Tracking', done: false },
  { label: 'Vendor Management', done: false },
  { label: 'Team Management', done: false },
  { label: 'Dashboard Analytics', done: false },
  { label: 'Document Storage', done: false },
  { label: 'Reports System', done: false },
  { label: 'Communication Features', done: false },
]

export function CrmProgressBar() {
  const completed = steps.filter(s => s.done).length
  const percent = (completed / steps.length) * 100
  return (
    <div className="w-full max-w-xl mx-auto my-8">
      <div className="flex justify-between mb-2 text-xs font-medium text-muted-foreground">
        {steps.map((s, i) => (
          <span key={i} className={s.done ? 'text-green-600' : ''}>{s.label}</span>
        ))}
      </div>
      <Progress value={percent} className="h-3" />
      <div className="text-center mt-2 text-sm font-semibold">{completed} of {steps.length} modules complete</div>
    </div>
  )
}
