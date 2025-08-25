import { SEO } from "@/components/SEO";

const Pricing = () => {
  return (
    <>
      <SEO
        title="Tarifs | Shopopti+"
        description="Plans Standard, Pro et Ultra Pro. Choisissez le plan adapté à votre business dropshipping."
        path="/pricing"
        keywords="tarifs Shopopti, abonnement dropshipping, SaaS e-commerce"
      />
      <div className="min-h-screen bg-background py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Tarifs Shopopti+</h1>
          <p className="text-xl text-muted-foreground">Choisissez le plan adapté à vos besoins</p>
        </div>
      </div>
    </>
  );
};

export default Pricing;