import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(39,39,42,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(39,39,42,0.1)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      
      <div className="z-10 flex flex-col items-center max-w-lg text-center font-mono">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20 mb-8">
          <span className="text-3xl text-rose-500 font-bold">404</span>
        </div>
        
        <h1 className="text-xl font-bold text-zinc-100 mb-2 tracking-tight">STATUS: 404</h1>
        <h2 className="text-sm font-semibold text-rose-400 mb-6 tracking-widest">ERROR: ASSET_OR_ROUTE_NOT_LOCATED</h2>
        
        <p className="text-zinc-400 text-sm leading-relaxed mb-10 border border-zinc-800 bg-zinc-900/50 p-6 rounded-lg">
          The requested SEC filing, ticker, or routing path does not exist in the current database cluster.
        </p>
        
        <Link 
          href="/"
          className="group relative inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-zinc-100 transition-colors bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 hover:text-white rounded-md overflow-hidden"
        >
          <span className="mr-2 opacity-70 group-hover:-translate-x-1 transition-transform">←</span>
          Return to Command Center
        </Link>
      </div>
    </div>
  );
}
