import { Testimonial } from '@/data/homeData';
import { Star } from 'lucide-react';

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export default function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <div className="bg-card text-card-foreground rounded-lg p-6 shadow-card h-full">
      <div className="flex items-center mb-4">
        <img
          src={testimonial.avatar}
          alt={`Photo de profil de ${testimonial.name}`}
          className="w-12 h-12 rounded-full mr-4"
          loading="lazy"
          width="48"
          height="48"
        />
        <div>
          <div className="font-semibold">{testimonial.name}</div>
          <div className="text-sm text-muted-foreground">{testimonial.company}</div>
        </div>
      </div>
      
      <div className="flex mb-3" role="img" aria-label={`${testimonial.rating} étoiles sur 5`}>
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            aria-hidden="true"
          />
        ))}
      </div>
      
      <p className="text-muted-foreground text-sm leading-relaxed italic">
        "{testimonial.content}"
      </p>
    </div>
  );
}