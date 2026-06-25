import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service · Velqorfi" },
      { name: "description", content: "Velqorfi Terms of Service — rules and guidelines for using our platform." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="shell-mobile min-h-screen bg-background px-5 py-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft size={16} /> Back
      </Link>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent">
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: June 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using Velqorfi, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">2. Eligibility</h2>
            <p>You must be at least 18 years old and a resident of India to use Velqorfi. By using our services, you represent and warrant that you meet these requirements and that you have the legal capacity to enter into these Terms.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">3. Account Registration</h2>
            <p>You must create an account to use our services. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">4. Crypto Trading</h2>
            <p>Cryptocurrency trading involves significant risk. The value of cryptocurrencies can go up or down and there is a substantial risk that you could lose money. You should only trade with funds you can afford to lose. Velqorfi is not liable for any trading losses.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">5. UPI Payments</h2>
            <p>UPI transactions are processed through NPCI-regulated payment infrastructure. Velqorfi is not responsible for delays or failures caused by your bank or the UPI network. All transactions are final once confirmed.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">6. KYC Compliance</h2>
            <p>We are required by law to verify the identity of our users. You agree to provide accurate and complete KYC information when requested. Failure to provide KYC information may result in suspension of your account.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">7. Prohibited Activities</h2>
            <p>You may not use Velqorfi for any illegal purpose, including money laundering, tax evasion, or funding terrorist activities. We reserve the right to suspend or terminate accounts engaged in prohibited activities.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">8. Fees</h2>
            <p>Velqorfi charges fees for transactions as displayed on the platform at the time of transaction. We reserve the right to change our fee structure with prior notice to users.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Velqorfi shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use our services.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">10. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at <span className="text-cyan-400">techeowl.help@gmail.com</span></p>
          </section>

        </div>
      </div>
    </div>
  );
}
