import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Users, Shield, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AnimatedCard } from "@/components/AnimatedSection";

export const HeroSection = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const backgroundImages = [
    "/bgm.png",
    "/bgm2.png",
    "/bgm3.png"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % backgroundImages.length);
    }, 5000); // Change slide every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* Background Slideshow with Parallax */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {backgroundImages.map((image, index) => (
          <motion.div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
            initial={{ scale: 1.1 }}
            animate={{ scale: index === currentSlide ? 1 : 1.1 }}
            transition={{ duration: 10, ease: "linear" }}
          >
            <img
              src={image}
              alt={`Background slide ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </motion.div>
        ))}
        {/* Gradient Overlay - Static Blue */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/50" />
        {/* Floating Elements */}
        <motion.div
          className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-24 h-24 bg-secondary/20 rounded-full blur-lg"
          animate={{
            y: [0, 15, 0],
            x: [0, -10, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
        {backgroundImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2.5 transition-all duration-300 rounded-full ${
              index === currentSlide
                ? "bg-white w-8"
                : "bg-white/50 hover:bg-white/75 w-2.5"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            className="text-center lg:text-left"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h1 
              className="text-4xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              STUDENT WELFARE FUND SYSTEM
            </motion.h1>
            <motion.p 
              className="text-lg text-primary-foreground/90 mb-8 leading-relaxed"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Universiti Kuala Lumpur provides comprehensive 
              financial assistance to support your educational journey. Apply for emergency aid through our streamlined digital platform.
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" className="bg-secondary hover:bg-secondary-light text-secondary-foreground font-semibold" onClick={() => navigate('/login')}>
                  <FileText className="mr-2 h-5 w-5" />
                  Apply Now
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AnimatedCard delay={0.2}>
              <Card className="p-6 bg-card/95 backdrop-blur-sm border-primary-lighter/20 shadow-card hover:shadow-elevated transition-all duration-300 hover:border-primary-lighter/40">
                <div className="flex items-center mb-4">
                  <motion.div 
                    className="bg-primary-lighter p-2 rounded-lg mr-3"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <FileText className="h-5 w-5 text-primary" />
                  </motion.div>
                  <h3 className="font-semibold text-card-foreground">Easy Application</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Simple online form with step-by-step guidance
                </p>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.4}>
              <Card className="p-6 bg-card/95 backdrop-blur-sm border-primary-lighter/20 shadow-card hover:shadow-elevated transition-all duration-300 hover:border-primary-lighter/40">
                <div className="flex items-center mb-4">
                  <motion.div 
                    className="bg-secondary-lighter p-2 rounded-lg mr-3"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Users className="h-5 w-5 text-secondary" />
                  </motion.div>
                  <h3 className="font-semibold text-card-foreground">Committee Review</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Expert evaluation by qualified committee members
                </p>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.6}>
              <Card className="p-6 bg-card/95 backdrop-blur-sm border-primary-lighter/20 shadow-card hover:shadow-elevated transition-all duration-300 hover:border-primary-lighter/40">
                <div className="flex items-center mb-4">
                  <motion.div 
                    className="bg-success/20 p-2 rounded-lg mr-3"
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Shield className="h-5 w-5 text-success" />
                  </motion.div>
                  <h3 className="font-semibold text-card-foreground">Admin Approval</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Final administrative review and approval process
                </p>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.8}>
              <Card className="p-6 bg-card/95 backdrop-blur-sm border-primary-lighter/20 shadow-card hover:shadow-elevated transition-all duration-300 hover:border-primary-lighter/40">
                <div className="flex items-center mb-4">
                  <motion.div 
                    className="bg-primary-lighter p-2 rounded-lg mr-3"
                    whileHover={{ scale: 1.2, rotate: 45 }}
                    transition={{ duration: 0.4 }}
                  >
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </motion.div>
                  <h3 className="font-semibold text-card-foreground">Quick Processing</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Efficient workflow with transparent status updates
                </p>
              </Card>
            </AnimatedCard>
          </div>
        </div>
      </div>
    </section>
  );
};