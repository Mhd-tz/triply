import SiteHeader from "@/components/layout/site-header";

//applayout.tsx
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      {children}
    </div>
  );
};

export default AppLayout;
