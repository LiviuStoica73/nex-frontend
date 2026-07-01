import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Privacy Policy — Nex-Nex",
  description:
    "Privacy Policy for Nex-Nex. Learn how we collect, use, and protect your personal data.",
});

const LAST_UPDATED = "July 1, 2026";
const CONTACT_EMAIL = "privacy@nex-nex.com";
const COMPANY_NAME = "Nex-Nex";

export default function PrivacyPage() {
  return (
    <div className="container max-w-4xl py-12 md:py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">

        <section>
          <p>
            This Privacy Policy explains how {COMPANY_NAME}, operated by Liviu Stoica
            (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), collects, uses, stores, and
            shares your personal data when you use the {COMPANY_NAME} platform at{" "}
            <a href="https://nex-nex.com" className="underline">nex-nex.com</a> and its related
            services (web dashboard, Telegram Bot, API).
          </p>
          <p className="mt-3">
            We are committed to protecting your privacy and complying with applicable data protection
            laws, including the General Data Protection Regulation (GDPR, EU 2016/679).
          </p>
        </section>

        {/* 1 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Data Controller</h2>
          <p>
            The data controller responsible for your personal data is:
          </p>
          <address className="not-italic mt-3 pl-4 border-l-2 border-border space-y-1">
            <p><strong>Liviu Stoica</strong></p>
            <p>Operating as {COMPANY_NAME}</p>
            <p>Romania</p>
            <p>
              Email:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a>
            </p>
          </address>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">2. Data We Collect</h2>

          <h3 className="font-semibold mt-4 mb-2">2.1 Account Information</h3>
          <p>
            When you register, we collect: name, email address, and profile picture (via Google OAuth
            or email/password). If you sign in with Google, we receive the information your Google
            account shares according to your Google privacy settings.
          </p>

          <h3 className="font-semibold mt-4 mb-2">2.2 Organization and Brand Data</h3>
          <p>
            Information you provide when creating an organization or brand: organization name, brand
            name, brand description, tone settings, target languages, and brand kit assets (logo,
            color palette, font preferences, identity documents).
          </p>

          <h3 className="font-semibold mt-4 mb-2">2.3 Social Account Connections</h3>
          <p>
            When you connect a social media account (Facebook, Instagram, LinkedIn, X/Twitter,
            Discord, etc.), we store OAuth access tokens and refresh tokens, the platform account ID,
            and display name. These credentials are stored encrypted and used solely to publish
            content on your behalf.
          </p>

          <h3 className="font-semibold mt-4 mb-2">2.4 Content You Create</h3>
          <p>
            Posts, captions, images, and other content you create or upload through the Service, as
            well as the AI-generated outputs produced for your account.
          </p>

          <h3 className="font-semibold mt-4 mb-2">2.5 Billing Information</h3>
          <p>
            Payment processing is handled entirely by LemonSqueezy (our Merchant of Record). We do
            not store or have access to your credit card numbers. We receive transaction identifiers,
            subscription status, and billing email from LemonSqueezy.
          </p>

          <h3 className="font-semibold mt-4 mb-2">2.6 Usage Data</h3>
          <p>
            We collect data about how you use the Service: pages visited, features used, credit
            consumption, publish times, error events, and general interaction logs. This data is used
            to improve the Service and for analytics.
          </p>

          <h3 className="font-semibold mt-4 mb-2">2.7 Telegram Bot Data</h3>
          <p>
            If you use the Nex-Nex Telegram Bot, we collect your Telegram user ID and the messages
            you send to the bot. Telegram user IDs are linked to your {COMPANY_NAME} account via a
            secure pairing token. We do not store the full conversation history beyond what is
            necessary for session context and audit logs.
          </p>

          <h3 className="font-semibold mt-4 mb-2">2.8 Technical Data</h3>
          <p>
            IP addresses, browser type, operating system, and session identifiers collected
            automatically for security, fraud prevention, and debugging purposes.
          </p>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">3. How We Use Your Data</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Providing the Service:</strong> generating content, scheduling and publishing
              posts to your connected social accounts, managing your campaigns and calendar.
            </li>
            <li>
              <strong>Personalization:</strong> storing your brand voice, RAG context, and
              preferences to improve AI output quality for your specific account.
            </li>
            <li>
              <strong>Billing and account management:</strong> processing payments, sending invoices,
              managing subscriptions and credit balances.
            </li>
            <li>
              <strong>Communication:</strong> sending transactional emails (account confirmation,
              publish notifications, billing receipts) and important service updates.
            </li>
            <li>
              <strong>Security and fraud prevention:</strong> detecting abuse, protecting against
              unauthorized access, enforcing the anti-abuse rules described in the Terms of Service.
            </li>
            <li>
              <strong>Analytics and improvement:</strong> understanding how users interact with the
              Service to fix bugs and develop new features.
            </li>
            <li>
              <strong>Legal compliance:</strong> meeting our obligations under applicable laws,
              including responding to lawful requests from public authorities.
            </li>
          </ul>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">4. Legal Basis for Processing (GDPR)</h2>
          <p>We process your personal data on the following legal grounds:</p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li>
              <strong>Contract performance (Art. 6(1)(b) GDPR):</strong> processing necessary to
              provide the Service you signed up for (account management, content generation,
              publishing, billing).
            </li>
            <li>
              <strong>Legitimate interests (Art. 6(1)(f) GDPR):</strong> security, fraud prevention,
              abuse detection, product analytics, and improving the Service.
            </li>
            <li>
              <strong>Consent (Art. 6(1)(a) GDPR):</strong> marketing communications, where we rely
              on your explicit consent. You may withdraw consent at any time.
            </li>
            <li>
              <strong>Legal obligation (Art. 6(1)(c) GDPR):</strong> where required by law (e.g.,
              tax records, law enforcement requests).
            </li>
          </ul>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">5. Third-Party Services We Use</h2>
          <p>
            We rely on trusted third-party providers to operate the Service. Each processor handles
            your data only as instructed by us and under appropriate data protection agreements:
          </p>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-semibold">Provider</th>
                  <th className="text-left py-2 pr-4 font-semibold">Purpose</th>
                  <th className="text-left py-2 font-semibold">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-2 pr-4">Hetzner Online GmbH</td>
                  <td className="py-2 pr-4">Cloud hosting (servers, databases)</td>
                  <td className="py-2">EU (Germany)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Cloudflare, Inc.</td>
                  <td className="py-2 pr-4">CDN, DDoS protection, DNS, SSL</td>
                  <td className="py-2">USA (SCCs)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">LemonSqueezy</td>
                  <td className="py-2 pr-4">Payment processing, subscriptions, invoicing (MoR)</td>
                  <td className="py-2">USA (SCCs)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">OpenAI, Inc.</td>
                  <td className="py-2 pr-4">AI text generation (GPT-4o-mini)</td>
                  <td className="py-2">USA (SCCs)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Fal.ai</td>
                  <td className="py-2 pr-4">AI image generation (FLUX)</td>
                  <td className="py-2">USA (SCCs)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Google LLC (Gemini)</td>
                  <td className="py-2 pr-4">AI image generation (Gemini)</td>
                  <td className="py-2">USA (SCCs)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Cloudflare R2</td>
                  <td className="py-2 pr-4">Media storage (campaign images, brand assets)</td>
                  <td className="py-2">EU</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Resend</td>
                  <td className="py-2 pr-4">Transactional email delivery</td>
                  <td className="py-2">USA (SCCs)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Telegram Messenger Inc.</td>
                  <td className="py-2 pr-4">Bot interface (messages and commands)</td>
                  <td className="py-2">UAE / Dubai</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            SCCs = Standard Contractual Clauses (EU-approved transfer mechanism for data transfers
            outside the EEA).
          </p>
          <p className="mt-3">
            AI prompt data (your content and brand context) sent to OpenAI, Fal.ai, and Gemini is
            processed under their respective API data processing agreements. We have opted out of AI
            training where such options are available. Prompts are not used to train shared models.
          </p>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Account data:</strong> retained for as long as your account is active. If you
              delete your account, we delete or anonymize your personal data within 30 days, except
              where retention is required by law (e.g., financial records: 5 years).
            </li>
            <li>
              <strong>Published content and campaign data:</strong> retained for the duration of your
              subscription plus 90 days after account deletion, to allow for any disputes or data
              export requests.
            </li>
            <li>
              <strong>Media files (Cloudflare R2):</strong> campaign media is automatically moved to
              infrequent-access storage after 6 months and deleted after 24 months or upon account
              deletion.
            </li>
            <li>
              <strong>Audit logs and security logs:</strong> retained for 12 months.
            </li>
            <li>
              <strong>Billing records:</strong> retained for 5 years as required by Romanian
              accounting law.
            </li>
          </ul>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">7. Your Rights (GDPR)</h2>
          <p>
            If you are located in the European Economic Area, you have the following rights regarding
            your personal data:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li>
              <strong>Right of access:</strong> request a copy of the personal data we hold about you.
            </li>
            <li>
              <strong>Right to rectification:</strong> request correction of inaccurate data.
            </li>
            <li>
              <strong>Right to erasure:</strong> request deletion of your data (&ldquo;right to be
              forgotten&rdquo;), subject to legal retention obligations.
            </li>
            <li>
              <strong>Right to restriction:</strong> request that we limit how we use your data while
              a dispute is resolved.
            </li>
            <li>
              <strong>Right to data portability:</strong> receive your data in a structured,
              machine-readable format.
            </li>
            <li>
              <strong>Right to object:</strong> object to processing based on legitimate interests,
              including direct marketing.
            </li>
            <li>
              <strong>Right to withdraw consent:</strong> where processing is based on consent, you
              may withdraw it at any time without affecting the lawfulness of prior processing.
            </li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a>. We will
            respond within 30 days. You also have the right to lodge a complaint with the Romanian
            National Supervisory Authority for Personal Data Processing (ANSPDCP) at{" "}
            <a
              href="https://www.dataprotection.ro"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              dataprotection.ro
            </a>
            .
          </p>
        </section>

        {/* 8 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">8. Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal
            data against unauthorized access, alteration, disclosure, or destruction. These include:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>TLS encryption for all data in transit (HTTPS);</li>
            <li>Encryption of OAuth tokens at rest;</li>
            <li>Multi-tenant isolation — each organization&rsquo;s data is logically separated at the
              database level using organization IDs enforced on every query;</li>
            <li>Restricted access to production systems;</li>
            <li>Regular security reviews.</li>
          </ul>
          <p className="mt-3">
            Despite our efforts, no system is 100% secure. If you believe your data has been
            compromised, contact us immediately at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a>.
          </p>
        </section>

        {/* 9 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">9. Cookies</h2>
          <p>
            The Service uses the following types of cookies and similar technologies:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li>
              <strong>Essential cookies:</strong> required for authentication sessions and basic
              functionality. Cannot be disabled.
            </li>
            <li>
              <strong>Preference cookies:</strong> remember your theme (light/dark), language, and
              other UI preferences.
            </li>
            <li>
              <strong>Analytics cookies:</strong> help us understand how users navigate the platform.
              These are first-party analytics only — we do not use Google Analytics or other
              third-party tracking scripts on the authenticated dashboard.
            </li>
          </ul>
          <p className="mt-3">
            The marketing site (nex-nex.com home page and public pages) may use minimal analytics
            to measure page visits. We do not use advertising cookies or sell your data to
            advertisers.
          </p>
        </section>

        {/* 10 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">10. Children</h2>
          <p>
            The Service is not directed to children under 18. We do not knowingly collect personal
            data from children. If you believe a child has provided us with personal data, contact us
            at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a> and we
            will delete it promptly.
          </p>
        </section>

        {/* 11 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">11. International Transfers</h2>
          <p>
            Your data may be transferred to and processed in countries outside the European Economic
            Area (EEA), including the United States. Where such transfers occur, we ensure appropriate
            safeguards are in place — primarily the European Commission&rsquo;s Standard Contractual
            Clauses (SCCs) or adequacy decisions. See Section 5 for the specific providers and their
            locations.
          </p>
        </section>

        {/* 12 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">12. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. Material changes will be communicated via
            email or an in-app notice at least 14 days before they take effect. The date at the top
            of this page reflects the most recent revision. Continued use of the Service after the
            effective date constitutes acceptance of the updated policy.
          </p>
        </section>

        {/* 13 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">13. Contact</h2>
          <p>
            For any privacy-related questions, requests, or complaints, contact our privacy team at:
          </p>
          <p className="mt-3">
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a>
          </p>
          <p className="mt-3">
            We aim to respond to all requests within 30 days. For complex requests, we may extend
            this period by a further 60 days and will notify you accordingly.
          </p>
        </section>

      </div>
    </div>
  );
}
