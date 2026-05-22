export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div
        className="w-8 h-8 rounded-full animate-spin"
        style={{ border: '2px solid rgba(134,96,239,0.25)', borderTopColor: 'var(--purple)' }}
      />
    </div>
  )
}
