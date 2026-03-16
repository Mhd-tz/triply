const AppLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex h-screen">
            {children}
        </div>
    );
};

export default AppLayout;