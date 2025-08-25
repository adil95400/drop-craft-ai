import { SEO } from "@/components/SEO";

const Contact = () => {
  return (
    <>
      <SEO
        title="Contactez-nous | Shopopti+"
        description="Contactez notre équipe support pour en savoir plus sur nos intégrations et automatisations IA."
        path="/contact"
        keywords="contact Shopopti, support SaaS, aide dropshipping"
      />
      <div className="min-h-screen bg-background py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Contactez notre équipe</h1>
          <p className="text-xl text-muted-foreground">Support technique et commercial disponible</p>
        </div>
      </div>
    </>
  );
};

export default Contact;