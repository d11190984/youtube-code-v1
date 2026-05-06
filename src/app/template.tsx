export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in zoom-in-[0.98] slide-in-from-bottom-2 duration-500 ease-out fill-mode-both">
      {children}
    </div>
  );
}
