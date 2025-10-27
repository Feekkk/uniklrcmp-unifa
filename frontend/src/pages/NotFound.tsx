import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/Footer";
import { 
  Home, 
  ArrowLeft, 
  Search, 
  AlertTriangle,
  RefreshCw,
  FileX,
  Navigation,
  Clock
} from "lucide-react";
const unikLogo = '/rcmp.png';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-3">
                <img 
                  src={unikLogo} 
                  alt="UniKL Logo" 
                  className="h-12 w-12 object-contain"
                />
                <div>
                  <h1 className="text-xl font-bold text-slate-900">RCMP UniFA</h1>
                  <p className="text-sm text-slate-600">UniKL RCMP Financial Aids</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center">
                    <FileX className="w-12 h-12 text-red-500" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                </div>
              </div>
              <CardTitle className="text-6xl font-bold text-slate-900 mb-2">404</CardTitle>
              <CardDescription className="text-xl text-slate-600">
                Page Not Found
              </CardDescription>
            </CardHeader>
            
            <CardContent className="text-center space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-900">
                  Oops! The page you're looking for doesn't exist.
                </h3>
                <p className="text-slate-600">
                  The URL <code className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono text-sm">
                    {location.pathname}
                  </code> could not be found.
                </p>
              </div>

              {/* Help Section */}
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-4 flex items-center justify-center">
                  <Navigation className="w-5 h-5 mr-2 text-blue-600" />
                  What can you do?
                </h4>
                <div className="grid sm:grid-cols-2 gap-4 text-sm text-slate-600">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Check the URL for typos</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Use the navigation menu</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Go back to the previous page</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Contact support if needed</span>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">Quick Links</h4>
                <div className="flex flex-wrap justify-center gap-2">
                  <Link to="/">
                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-600">
                      <Home className="w-4 h-4 mr-1" />
                      Home
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-600">
                      <Search className="w-4 h-4 mr-1" />
                      Login
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-600">
                      <FileX className="w-4 h-4 mr-1" />
                      Register
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Error Info */}
              <div className="text-xs text-slate-400 flex items-center justify-center space-x-4">
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date().toLocaleString()}
                </span>
                <span>Error Code: 404</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NotFound;
