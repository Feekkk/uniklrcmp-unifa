import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, DollarSign, GraduationCap, Users, Calendar, Heart, Stethoscope, Shield, AlertTriangle, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedCard } from "@/components/AnimatedSection";

export const EligibilitySection = () => {

  const supportTypes = [
    {
      category: "Bereavement (Khairat)",
      icon: Heart,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      items: [
        { type: "Student", amount: "RM 500", description: "Support for student bereavement" },
        { type: "Parent", amount: "RM 200", description: "Support for parent bereavement" },
        { type: "Sibling", amount: "RM 100", description: "Support for sibling bereavement" }
      ]
    },
    {
      category: "Illness & Injuries",
      icon: Stethoscope,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      items: [
        {
          type: "Out-patient Treatment",
          amount: "RM 30/semester",
          description: "Limited to two claims per year",
          note: "Allowable for two claims per year"
        },
        {
          type: "In-patient Treatment",
          amount: "Up to RM 1,000",
          description: "Only if hospitalization exceeds insurance coverage",
          note: "Annual limit RM 20,000 per student. More than RM 1,000 requires committee approval"
        },
        {
          type: "Injuries",
          amount: "Up to RM 200",
          description: "Coverage for injury support equipment",
          note: "Limited to injury support equipment"
        }
      ]
    },
    {
      category: "Emergency",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      items: [
        {
          type: "Critical Illness",
          amount: "RM 200",
          description: "Initial diagnosis support",
          note: "Requires appropriate supporting documents"
        },
        {
          type: "Natural Disaster",
          amount: "RM 200",
          description: "Disaster relief support",
          note: "Requires certified evidence of incident"
        },
        {
          type: "Others",
          amount: "Variable",
          description: "Other emergency cases",
          note: "Subject to SWF Campus committee approval"
        }
      ]
    }
  ];

  return (
    <section id="support-types" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-16"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.h2 
            className="text-4xl font-bold text-primary mb-4"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            SWF 2001: Student Welfare Fund Application
          </motion.h2>
          <motion.p 
            className="text-lg text-muted-foreground max-w-3xl mx-auto"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            Comprehensive financial support covering bereavement, illness, injuries, and emergency situations
            for all registered UniKL students.
          </motion.p>
        </motion.div>

        <div className="space-y-12">
          {supportTypes.map((category, categoryIndex) => {
            const IconComponent = category.icon;
            return (
              <motion.div 
                key={categoryIndex}
                initial={{ y: 60, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: categoryIndex * 0.2 }}
                viewport={{ once: true }}
              >
                <motion.div 
                  className="flex items-center mb-8"
                  whileHover={{ x: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div 
                    className={`${category.bgColor} p-4 rounded-lg mr-4`}
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <IconComponent className={`h-8 w-8 ${category.color}`} />
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">{category.category}</h3>
                    <p className="text-muted-foreground">Financial assistance for various life situations</p>
                  </div>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.items.map((item, itemIndex) => (
                    <AnimatedCard 
                      key={itemIndex} 
                      delay={categoryIndex * 0.2 + itemIndex * 0.1}
                    >
                      <motion.div
                        whileHover={{ y: -8, scale: 1.02 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card
                          className={`shadow-card hover:shadow-elevated transition-all duration-300 border-l-4 ${category.borderColor} hover:border-opacity-60`}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg text-foreground">{item.type}</CardTitle>
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Badge variant="secondary" className="text-sm font-semibold">
                                  {item.amount}
                                </Badge>
                              </motion.div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground text-sm mb-3">{item.description}</p>
                            {item.note && (
                              <motion.div 
                                className="flex items-start space-x-2 text-xs"
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                viewport={{ once: true }}
                              >
                                <motion.div
                                  whileHover={{ rotate: 360 }}
                                  transition={{ duration: 0.5 }}
                                >
                                  <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                                </motion.div>
                                <span className="text-warning font-medium">{item.note}</span>
                              </motion.div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    </AnimatedCard>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        <Card className="mt-16 bg-gradient-to-r from-primary-lighter to-secondary-lighter border-0">
          <CardContent className="p-8 text-center">
            <h4 className="text-2xl font-bold text-primary mb-4">Application Process</h4>
            <p className="text-muted-foreground mb-4">
              All SWF applications undergo a comprehensive review process by the SWF Campus Committee.
              Higher amounts may require additional committee approval and supporting documentation.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm font-medium">Submit Application</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Committee Review</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Shield className="h-5 w-5 text-secondary" />
                <span className="text-sm font-medium">Approval & Disbursement</span>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-primary/20">
              <p className="text-muted-foreground mb-4">
                For questions regarding SWF applications, contact our support team:
              </p>
              <button
                onClick={() => window.open('mailto:sw.rcmp@unikl.edu.my', '_blank')}
                className="inline-flex items-center px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:scale-105"
              >
                <Mail className="h-5 w-5 mr-2" />
                Contact SWF Support
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};