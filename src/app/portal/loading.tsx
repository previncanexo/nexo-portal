function Bone({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-2xl animate-pulse ${className ?? ''}`}
      style={{ background: 'rgba(255,255,255,0.08)', ...style }}
    />
  )
}

export default function PortalLoading() {
  return (
    <div className="flex flex-col gap-7 pb-10">
      <div className="pt-1">
        <Bone className="h-3 w-20 mb-2" />
        <Bone className="h-9 w-44 mb-2" />
        <Bone className="h-3 w-56" />
      </div>
      <Bone className="h-48" style={{ borderRadius: '1.5rem' }} />
      <div>
        <Bone className="h-3 w-24 mb-3" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => <Bone key={i} className="h-16" />)}
        </div>
      </div>
      <div>
        <Bone className="h-3 w-32 mb-3" />
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => <Bone key={i} className="h-14" />)}
        </div>
      </div>
    </div>
  )
}
