export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-20 ${className}`}>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-bright border-t-primary" />
    </div>
  )
}
