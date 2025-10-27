import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Users, Mail, Building, GraduationCap, UserCheck, Shield, FileText } from "lucide-react";

export const StudentContributionSection = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-primary border-primary/20">
              Student Contribution & Committee
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Student Welfare Fund Structure
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Understanding how the fund operates and who manages it for the benefit of all students
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Student Contribution Section */}
            <Card className="border-primary/10 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center mb-2">
                  <div className="bg-primary/10 p-3 rounded-lg mr-4">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl text-foreground">Student Contribution SWF</CardTitle>
                </div>
                <p className="text-muted-foreground">
                  The fund collection is based on SWF fees collected from registered students
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Local Student Fee */}
                  <div className="relative">
                    <Card className="border-success/20 bg-gradient-to-r from-success/5 to-success/10">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-success/20 p-3 rounded-lg">
                              <GraduationCap className="h-6 w-6 text-success" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground text-lg">Local Student</h3>
                              <p className="text-muted-foreground text-sm">Malaysian students</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-success">RM30.00</div>
                            <p className="text-sm text-muted-foreground">per semester</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* International Student Fee */}
                  <div className="relative">
                    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-primary/20 p-3 rounded-lg">
                              <Building className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground text-lg">International Student</h3>
                              <p className="text-muted-foreground text-sm">Non-Malaysian students</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-primary">RM50.00</div>
                            <p className="text-sm text-muted-foreground">per semester</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator className="my-6" />

                  {/* Additional Info */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Payment Schedule</h4>
                        <p className="text-sm text-muted-foreground">
                          Fees are collected every semester as part of the student registration process.
                          This ensures continuous funding for student welfare programs.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SWF Campus Committee Section */}
            <Card className="border-secondary/10 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center mb-2">
                  <div className="bg-secondary/10 p-3 rounded-lg mr-4">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                  <CardTitle className="text-2xl text-foreground">SWF Campus Committee Members</CardTitle>
                </div>
                <p className="text-muted-foreground">
                  Dedicated committee members ensuring proper fund management and student welfare
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Committee Members List */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="bg-primary/20 p-2 rounded-lg">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Head of Campus / Dean</h4>
                        <p className="text-sm text-muted-foreground">Leadership oversight</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/5 border border-secondary/10">
                      <div className="bg-secondary/20 p-2 rounded-lg">
                        <UserCheck className="h-4 w-4 text-secondary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Deputy Dean, SDCL</h4>
                        <p className="text-sm text-muted-foreground">Academic administration</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-success/5 border border-success/10">
                      <div className="bg-success/20 p-2 rounded-lg">
                        <Users className="h-4 w-4 text-success" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Campus Lifestyle Head</h4>
                        <p className="text-sm text-muted-foreground">Student life coordination</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-warning/5 border border-warning/10">
                      <div className="bg-warning/20 p-2 rounded-lg">
                        <DollarSign className="h-4 w-4 text-warning" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Finance & Administration Representative</h4>
                        <p className="text-sm text-muted-foreground">Financial management</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="bg-primary/20 p-2 rounded-lg">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Campus Lifestyle Section Executive</h4>
                        <p className="text-sm text-muted-foreground">Operational management</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/5 border border-secondary/10">
                      <div className="bg-secondary/20 p-2 rounded-lg">
                        <GraduationCap className="h-4 w-4 text-secondary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Student Representative Committee President</h4>
                        <p className="text-sm text-muted-foreground">Student voice (by invitation)</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Contact Information */}
                  <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-4 rounded-lg border border-primary/10">
                    <div className="flex items-center space-x-3 mb-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold text-foreground">Contact Information</h4>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        For inquiries about the Student Welfare Fund:
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom CTA Section */}
          <div className="mt-12 text-center">
            <Card className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border-primary/20">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Your Contribution Makes a Difference
                </h3>
                <p className="text-muted-foreground mb-6 max-w-3xl mx-auto">
                  Every semester contribution goes directly towards supporting fellow students in times of need.
                  The SWF committee ensures transparent and responsible management of these funds,
                  providing essential welfare support when students need it most.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
