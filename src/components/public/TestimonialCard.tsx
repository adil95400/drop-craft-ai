import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';

interface TestimonialCardProps {
  name: string;
  role: string;
  company: string;
  avatar?: string;
  rating: number;
  text: string;
  metrics?: {
    label: string;
    value: string;
  };
}

export function TestimonialCard({ name, role, company, avatar, rating, text, metrics }: TestimonialCardProps) {
  return (
    <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2">
      <CardContent className="pt-6 space-y-4">
        {/* Rating */}
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`}
            />
          ))}
        </div>

        {/* Testimonial Text */}
        <p className="text-muted-foreground leading-relaxed">{text}</p>

        {/* Metrics Badge */}
        {metrics && (
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
            <div className="text-2xl font-bold text-primary">{metrics.value}</div>
            <div className="text-xs text-muted-foreground">{metrics.label}</div>
          </div>
        )}

        {/* Author */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Avatar className="h-12 w-12 border-2 border-primary/10">
            <AvatarImage src={avatar} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold">{name}</div>
            <div className="text-sm text-muted-foreground">
              {role} · {company}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
