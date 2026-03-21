export function GradientMesh({ className }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className || ''}`}>
      <div className="absolute top-[-50%] left-[-20%] w-[70%] h-[70%] rounded-full bg-accent-green/[0.07] blur-[120px] animate-float" />
      <div className="absolute bottom-[-30%] right-[-10%] w-[60%] h-[60%] rounded-full bg-accent-cyan/[0.05] blur-[120px] animate-float" style={{ animationDelay: '-3s' }} />
      <div className="absolute top-[20%] right-[20%] w-[40%] h-[40%] rounded-full bg-purple-500/[0.03] blur-[100px] animate-float" style={{ animationDelay: '-5s' }} />
    </div>
  );
}
