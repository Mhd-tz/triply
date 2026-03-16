import SiteHeader from "@/components/layout/site-header";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="h-screen">
            <SiteHeader />
            {children}
        </div>
    );
};

export default AppLayout;