import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Target, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedCard } from "@/components/AnimatedSection";

export const IntroductionSection = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div 
            className="text-center mb-12"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Badge variant="outline" className="mb-4 text-primary border-primary/20">
                About Student Welfare Fund
              </Badge>
            </motion.div>
            <motion.h2 
              className="text-3xl lg:text-4xl font-bold text-foreground mb-4"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              Introduction to Student Welfare Fund
            </motion.h2>
            <motion.p 
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
            >
              Supporting UniKL students through comprehensive welfare assistance and emergency support
            </motion.p>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* History Timeline */}
            <AnimatedCard delay={0.2}>
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-primary/10 shadow-lg hover:shadow-elevated transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-6">
                      <motion.div 
                        className="bg-primary/10 p-3 rounded-lg mr-4"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <Calendar className="h-6 w-6 text-primary" />
                      </motion.div>
                      <h3 className="text-2xl font-semibold text-foreground">Our History</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <motion.div 
                        className="relative pl-6 border-l-2 border-primary/20"
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                      >
                        <div className="absolute -left-2 top-0 w-4 h-4 bg-primary rounded-full"></div>
                        <div className="mb-2">
                          <Badge variant="secondary" className="text-xs">September 30, 2005</Badge>
                        </div>
                        <h4 className="font-semibold text-foreground mb-2">Tabung Kebajikan Siswa (TKS) Established</h4>
                        <p className="text-muted-foreground text-sm">
                          TKS was established and endorsed by the Management of UniKL to provide 
                          welfare support for students.
                        </p>
                      </motion.div>
                      
                      <motion.div 
                        className="relative pl-6 border-l-2 border-primary/20"
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        viewport={{ once: true }}
                      >
                        <div className="absolute -left-2 top-0 w-4 h-4 bg-secondary rounded-full"></div>
                        <div className="mb-2">
                          <Badge variant="secondary" className="text-xs">December 12, 2017</Badge>
                        </div>
                        <h4 className="font-semibold text-foreground mb-2">Rebranded to Student Welfare Fund</h4>
                        <p className="text-muted-foreground text-sm">
                          TKS was officially rebranded to Student Welfare Fund (SWF), approved on 
                          TMM 30th Jan 2018 (TMM NO.125 (2/2018)).
                        </p>
                      </motion.div>
                      
                      <motion.div 
                        className="relative pl-6"
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        viewport={{ once: true }}
                      >
                        <div className="absolute -left-2 top-0 w-4 h-4 bg-success rounded-full"></div>
                        <div className="mb-2">
                          <Badge variant="outline" className="text-xs border-success text-success">Current</Badge>
                        </div>
                        <h4 className="font-semibold text-foreground mb-2">Campus Lifestyle Division Management</h4>
                        <p className="text-muted-foreground text-sm">
                          The Management of UniKL empowers Campus Lifestyle Division and Campus 
                          Lifestyle Section to manage the operation of SWF.
                        </p>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatedCard>

            {/* Objectives */}
            <AnimatedCard delay={0.4}>
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-secondary/10 shadow-lg hover:shadow-elevated transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-6">
                      <motion.div 
                        className="bg-secondary/10 p-3 rounded-lg mr-4"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Target className="h-6 w-6 text-secondary" />
                      </motion.div>
                      <h3 className="text-2xl font-semibold text-foreground">SWF UniKL RCMP Objectives</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <motion.div 
                        className="flex items-start space-x-4"
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                      >
                        <motion.div 
                          className="bg-primary/10 p-2 rounded-lg mt-1"
                          whileHover={{ rotate: 180 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Heart className="h-4 w-4 text-primary" />
                        </motion.div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Essential Welfare Support</h4>
                          <p className="text-muted-foreground text-sm">
                            Providing comprehensive welfare assistance to UniKL students in times of need.
                          </p>
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        className="flex items-start space-x-4"
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        viewport={{ once: true }}
                      >
                        <motion.div 
                          className="bg-secondary/10 p-2 rounded-lg mt-1"
                          whileHover={{ scale: 1.2 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Users className="h-4 w-4 text-secondary" />
                        </motion.div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Emergency Assistance</h4>
                          <p className="text-muted-foreground text-sm">
                            Offering immediate support during emergencies, medical conditions, or injuries.
                          </p>
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        className="flex items-start space-x-4"
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        viewport={{ once: true }}
                      >
                        <motion.div 
                          className="bg-success/10 p-2 rounded-lg mt-1"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <Heart className="h-4 w-4 text-success" />
                        </motion.div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Bereavement Support</h4>
                          <p className="text-muted-foreground text-sm">
                            Providing compassionate assistance to students facing bereavement situations.
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatedCard>
          </div>
        </div>
      </div>
    </section>
  );
};
