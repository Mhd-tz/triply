import HeroSection from "@/components/hero-section";
import OtherServices from "@/components/otherservices";
import FeaturedStays from "@/components/featured-stays";
import AppDownloadBanner from "@/components/app-downloader";
import Footer from "@/components/layout/site-footer";


const HomePage = () => {
    return (
        <>
            <HeroSection />
            <OtherServices />
            <FeaturedStays />
            <AppDownloadBanner />
            <Footer />
        </>
    );
};

export default HomePage;