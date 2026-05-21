function Bone({ className }: { className?: string }) {
  return <div className={`rounded-2xl animate-pulse ${className ?? ''}`} style={{ background: 'rgba(255,255,255,0.07)' }} />
}

export default function AdminLoading() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[1, 2, 3, 4].map((i) => <Bone key={i} className="h-24" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <Bone className="h-48" />
        <Bone className="h-48" />
      </div>
      <Bone className="h-64" />
    </main>
  )
}
