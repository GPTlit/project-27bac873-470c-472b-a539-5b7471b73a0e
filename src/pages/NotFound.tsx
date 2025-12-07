import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <div className="section-padding">
        <div className="container-library">
          <div className="flex flex-col items-center justify-center text-center py-16">
            <div className="text-8xl mb-6">📖</div>
            <h1 className="text-6xl font-bold text-gradient mb-4">404</h1>
            <p className="text-xl text-muted-foreground mb-8">
              عذراً، الصفحة التي تبحث عنها غير موجودة
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/">
                <Button variant="gold" size="lg" className="gap-2">
                  <Home className="h-5 w-5" />
                  العودة للرئيسية
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={() => window.history.back()}
              >
                <ArrowRight className="h-5 w-5" />
                الرجوع للخلف
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
