import { Button } from "@/components/ui/button";
import { User, LogIn } from "lucide-react";
import { Link } from "react-router-dom";

export const Header = () => {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  return (
    <header className="bg-background border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-background/95">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/rcmp.png" 
              alt="RCMP Logo" 
              className="h-12 w-12 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-primary">RCMP UniFA</h1>
              <p className="text-sm text-muted-foreground">UniKL RCMP Financial Aids</p>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#home" onClick={(e) => handleNavClick(e, 'home')} className="text-foreground hover:text-primary transition-colors cursor-pointer">Home</a>
            <a href="#eligibility" onClick={(e) => handleNavClick(e, 'eligibility')} className="text-foreground hover:text-primary transition-colors cursor-pointer">Application</a>
          </nav>

          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              <User className="h-4 w-4 mr-2" />
              Student Portal
            </Button>
            <Link to="/login">
              <Button size="sm" className="bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary">
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};