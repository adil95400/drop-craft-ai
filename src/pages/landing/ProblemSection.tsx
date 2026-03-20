import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Target, BarChart3 } from "lucide-react";

const PROBLEMS = [
  { icon: Clock, title: "Time-consuming manual tasks", desc: "Hours spent updating prices, managing inventory across suppliers, and fulfilling orders one by one. That's 20+ hours/week wasted." },
  { icon: Target, title: "Missed revenue opportunities", desc: "No way to spot winning products or optimize pricing before competitors. Trends pass you by while you're stuck in spreadsheets." },
  { icon: BarChart3, title: "Data overwhelm, zero insight", desc: "Too many dashboards, too many numbers, too little actionable intelligence. No clear path to scale profitably." },
] as const;

export const ProblemSection = memo(() => (
  <section className="py-16 lg:py-24" aria-label="The problem we solve">
    <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
      <div className="text-center space-y-4 mb-14">
        <Badge className="px-4 py-2 text-sm bg-destructive/10 text-destructive border-destructive/20">The Problem</Badge>
        <h2 className="text-3xl md:text-4xl font-bold">Running a Shopify store shouldn't feel like a full-time job</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Most Shopify merchants spend 60% of their time on tasks that AI can automate.
        </p>
      </div>
      <div className="grid sm:grid-cols-3 gap-6">
        {PROBLEMS.map((p, i) => (
          <Card key={i} className="border-destructive/20 bg-destructive/5 hover:shadow-md transition-shadow">
            <CardContent className="pt-6 text-center space-y-3">
              <div className="p-3 rounded-full bg-destructive/10 w-fit mx-auto">
                <p.icon className="h-6 w-6 text-destructive" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-lg">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
));
ProblemSection.displayName = "ProblemSection";
