import { Mail, Phone, MapPin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src="/unikl-rcmp.png" 
                alt="UniKL Logo" 
                className="h-16 w-auto md:h-20 object-contain"
              />

            </div>
            <p className="text-sm text-primary-foreground/80 leading-relaxed">
              Supporting student success through comprehensive student welfare programs.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#eligibility" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Eligibility Criteria</a></li>
              <li><a href="#apply" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Apply for Aid</a></li>
              <li><a href="#status" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Check Status</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Contact Support</a></li>
              <li><a href="/report-bug" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Report Bug</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact Info</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-secondary" />
                <span className="text-primary-foreground/80">sw.rcmp@unikl.edu.my</span>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-secondary mt-0.5" />
                <span className="text-primary-foreground/80">
                  UniKL Royal College of Medicine Perak<br />
                  No. 3, Jalan Greentown<br />
                  30450 Ipoh, Perak
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm">
            <p className="text-primary-foreground/80">
              © 2025 Universiti Kuala Lumpur Royal College of Medicine Perak. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};