export function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] w-full text-center">
      <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mb-md shadow-sm">
        <span className="material-symbols-outlined text-[40px] text-primary">construction</span>
      </div>
      <h2 className="text-headline-sm font-bold text-on-surface mb-xs">{title}</h2>
      <p className="text-body-md text-on-surface-variant w-full max-w-md px-md">
        This screen is currently under development. Please check back later when it's fully implemented!
      </p>
    </div>
  );
}
