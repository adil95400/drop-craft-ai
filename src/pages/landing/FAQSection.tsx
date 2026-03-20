import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FAQ_DATA } from "@/config/landingPageConfig";

export const FAQSection = memo(() => (
  <section className="py-14 sm:py-16 lg:py-24 bg-secondary/20" aria-labelledby="faq-heading">
    <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
      <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-12">
        <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">FAQ</Badge>
        <h2 id="faq-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ textWrap: 'balance' }}>
          Frequently Asked Questions
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground">Everything you need to know about ShopOpti+.</p>
      </div>

      <Accordion type="single" collapsible className="space-y-3">
        {FAQ_DATA.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="bg-background rounded-lg border px-4 sm:px-6">
            <AccordionTrigger className="text-left font-semibold hover:no-underline py-4 text-sm sm:text-base">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed pb-4 text-sm sm:text-base">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
));
FAQSection.displayName = "FAQSection";
