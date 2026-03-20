import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FAQ_DATA } from "@/config/landingPageConfig";

export const FAQSection = memo(() => (
  <section className="py-16 lg:py-24 bg-secondary/20" aria-label="Frequently asked questions">
    <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
      <div className="text-center space-y-4 mb-12">
        <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">FAQ</Badge>
        <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
        <p className="text-lg text-muted-foreground">Everything you need to know about ShopOpti+.</p>
      </div>

      <Accordion type="single" collapsible className="space-y-3">
        {FAQ_DATA.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="bg-background rounded-lg border px-6">
            <AccordionTrigger className="text-left font-semibold hover:no-underline py-4">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
));
FAQSection.displayName = "FAQSection";
