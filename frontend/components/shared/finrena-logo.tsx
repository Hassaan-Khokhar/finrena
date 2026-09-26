import { Activity } from 'lucide-react';

export function FinrenaLogo({ className = "w-6 h-6", iconClassName = "w-full h-full" }: { className?: string; iconClassName?: string }) {
  return (
    <div className={`${className} flex items-center justify-center text-emerald-500 shrink-0`}>
      <Activity className={`${iconClassName} text-emerald-500 stroke-[2.2]`} />
    </div>
  );
}

