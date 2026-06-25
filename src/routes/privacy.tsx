import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy · Velqorfi" },
      { name: "description", content: "Velqorfi Privacy Policy — how we collect, use, and protect your data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="shell-mobile min-h-screen bg-background px-5 py-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft size={16} /> Back
      </Link>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: June 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">1. Information We Collect</h2>
            <p>When you use Velqorfi, we collect information you provide directly to us, including your name, email address, and payment information. We also collect information automatically when you use our services, such as log data, device information, and usage data.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">2. How We Use Your Information</h2>
            <p>We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and respond to your comments and questions. We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">3. Information Sharing</h2>
            <p>We may share your information with third-party vendors and service providers that perform services on our behalf, such as payment processing and data analytics. We may also disclose your information if required to do so by law or in response to valid requests by public authorities.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">4. Data Security</h2>
            <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction. All data is encrypted in transit using TLS and at rest using industry-standard encryption.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">5. KYC & Identity Verification</h2>
            <p>As a crypto exchange operating in India, we are required to collect KYC (Know Your Customer) information including government-issued ID. This information is collected and stored securely and used solely for regulatory compliance purposes.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">6. Cookies</h2>
            <p>We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">7. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal information at any time. To exercise these rights, please contact us at the email below. We will respond to your request within 30 days.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">8. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">9. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at <span className="text-cyan-400">techeowl.help@gmail.com</span></p>
          </section>

        </div>
      </div>
    </div>
  );
}
