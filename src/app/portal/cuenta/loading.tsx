function Bone({ className }: { className?: string }) {
  return <div className={`rounded-2xl animate-pulse ${className ?? ''}`} style={{ background: 'rgba(255,255,255,0.08)' }} />
}

export default function CuentaLoading() {
  return (
    <div className="flex flex-col gap-7 pb-10">
      <Bone className="h-4 w-16" />
      <div>
        <Bone className="h-8 w-36 mb-2" />
        <Bone className="h-3 w-64" />
      </div>
      <div className="rounded-3xl p-6 sm:p-7 flex flex-col gap-4" style={{ background: 'rgba(134,96,239,0.25)', border: '1px solid rgba(255,255,255,0.10)' }}>
        <Bone className="h-5 w-24 mb-2" />
        {[1, 2, 3, 4, 5, 6].map((i) => <Bone key={i} className="h-12" />)}
        <Bone className="h-12 rounded-full" />
      </div>
      <div className="rounded-3xl p-6 sm:p-7 flex flex-col gap-4" style={{ background: 'rgba(134,96,239,0.25)', border: '1px solid rgba(255,255,255,0.10)' }}>
        <Bone className="h-5 w-36 mb-2" />
        {[1, 2, 3].map((i) => <Bone key={i} className="h-12" />)}
        <Bone className="h-12 rounded-full" />
      </div>
    </div>
  )
}
