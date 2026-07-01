import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Terms of Service — Nex-Nex",
  description:
    "Terms of Service for Nex-Nex, the AI Content Copilot. Read our terms before using the platform.",
});

const LAST_UPDATED = "July 1, 2026";
const CONTACT_EMAIL = "legal@nex-nex.com";
const COMPANY_NAME = "Nex-Nex";
const SITE_URL = "https://nex-nex.com";

export default function TermsPage() {
  return (
    <div className="container max-w-4xl py-12 md:py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">

        <section>
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of {COMPANY_NAME}
            (&ldquo;Service&rdquo;), operated by Liviu Stoica (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) at{" "}
            <a href={SITE_URL} className="underline">{SITE_URL}</a>. By creating an account or
            using the Service, you agree to be bound by these Terms. If you do not agree, do not use
            the Service.
          </p>
        </section>

        {/* 1 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Description of Service</h2>
          <p>
            {COMPANY_NAME} is an AI-powered content creation and scheduling platform (&ldquo;AI Content
            Copilot&rdquo;). It allows users to generate, edit, schedule, and publish content to
            connected social media accounts using artificial intelligence. The Service includes a web
            dashboard, a Telegram Bot interface, and integrations with third-party social networks.
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">2. Eligibility</h2>
          <p>
            You must be at least 18 years old to use the Service. By using {COMPANY_NAME} you
            represent that you are 18 or older and have the legal capacity to enter into a binding
            agreement. If you are using the Service on behalf of an organization, you represent that
            you have the authority to bind that organization to these Terms.
          </p>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">3. Accounts</h2>
          <p>
            You must provide accurate and complete information when creating an account. You are
            responsible for maintaining the confidentiality of your credentials and for all activity
            that occurs under your account. Notify us immediately at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a> if you
            suspect unauthorized access to your account.
          </p>
          <p className="mt-3">
            You may not share your account, create multiple accounts to circumvent plan limits, or
            transfer your account to another person without our written consent.
          </p>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">4. Subscription Plans and Billing</h2>

          <h3 className="font-semibold mt-4 mb-2">4.1 Plans</h3>
          <p>
            {COMPANY_NAME} offers a Free plan and paid subscription plans (Starter, Pro, Business,
            Agency). Each plan includes a monthly AI credit allowance and limits on the number of
            connected brands and social accounts. Full plan details are published on our Pricing page.
          </p>

          <h3 className="font-semibold mt-4 mb-2">4.2 Credits</h3>
          <p>
            AI actions (text generation, image generation, platform adaptations) consume credits from
            your monthly allowance. Credits reset on the first day of each calendar month at 00:00
            UTC and do not roll over. Unused credits expire at the end of the month.
          </p>
          <p className="mt-2">
            Additional credit packs are available for one-time purchase and expire at the end of the
            current calendar month.
          </p>

          <h3 className="font-semibold mt-4 mb-2">4.3 Free Trial</h3>
          <p>
            Paid plans include a 14-day free trial. A valid payment method is required at sign-up.
            You will not be charged until the trial period ends. If you cancel before the trial
            ends, you will not be billed.
          </p>

          <h3 className="font-semibold mt-4 mb-2">4.4 Billing Cycle and Payments</h3>
          <p>
            Subscriptions are billed monthly or annually depending on the plan you select. Annual
            plans receive a discount equivalent to 2 months free (you pay for 10 months, access 12).
            Payments are processed by LemonSqueezy, our Merchant of Record. LemonSqueezy issues
            invoices, collects VAT where applicable, and remits it to relevant tax authorities.
          </p>

          <h3 className="font-semibold mt-4 mb-2">4.5 Upgrades and Downgrades</h3>
          <p>
            Upgrades take effect immediately and credits are prorated for the remainder of the billing
            cycle. Downgrades take effect at the start of the next billing cycle.
          </p>

          <h3 className="font-semibold mt-4 mb-2">4.6 Refunds</h3>
          <p>
            All fees are non-refundable except where required by applicable law. If you believe a
            charge is erroneous, contact us within 30 days of the charge at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a>.
          </p>

          <h3 className="font-semibold mt-4 mb-2">4.7 Anti-Abuse — Free and Trial</h3>
          <p>
            A social media account (identified by platform and account ID) may only be connected to
            one {COMPANY_NAME} account that is on the Free plan or in a trial period. Connecting the
            same social account across multiple Free or trial accounts is prohibited. Paid active
            subscriptions are not subject to this restriction.
          </p>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">5. Acceptable Use</h2>
          <p>You agree not to use the Service to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Violate any applicable law or regulation;</li>
            <li>Publish spam, misleading content, or content that violates the terms of connected social platforms;</li>
            <li>Generate, distribute, or promote illegal content, hate speech, harassment, or sexually explicit material;</li>
            <li>Infringe third-party intellectual property rights;</li>
            <li>Attempt to gain unauthorized access to the Service or its infrastructure;</li>
            <li>Reverse engineer, decompile, or extract source code from the Service;</li>
            <li>Use automated means to scrape, crawl, or excessively load the Service;</li>
            <li>Circumvent plan limits, abuse the Free tier, or create multiple accounts fraudulently;</li>
            <li>Resell or sublicense access to the Service without our express written permission.</li>
          </ul>
          <p className="mt-3">
            We reserve the right to investigate and take action, including suspension or termination,
            for any violation of these rules.
          </p>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">6. AI-Generated Content</h2>
          <p>
            The Service uses AI models (including OpenAI GPT-4o-mini, Fal.ai, and Google Gemini) to
            generate text and images. AI-generated content may be inaccurate, incomplete, or
            inappropriate. You are solely responsible for reviewing all AI-generated content before
            publishing and for ensuring it complies with applicable laws and platform policies.
          </p>
          <p className="mt-3">
            We do not warrant that AI-generated content is original or free from third-party rights.
            You assume all risk associated with publishing AI-generated content.
          </p>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">7. Your Content and Data</h2>

          <h3 className="font-semibold mt-4 mb-2">7.1 Ownership</h3>
          <p>
            You retain ownership of all content you create, upload, or generate through the Service
            (&ldquo;Your Content&rdquo;). By using the Service, you grant us a limited, non-exclusive,
            royalty-free license to store, process, and transmit Your Content solely for the purpose
            of providing the Service.
          </p>

          <h3 className="font-semibold mt-4 mb-2">7.2 Brand Kit and RAG Data</h3>
          <p>
            Documents, images, and brand data you upload to configure your Brand Kit and RAG
            (Retrieval-Augmented Generation) context are processed to improve AI output for your
            account. This data is isolated per organization and is not used to train shared AI models
            or shared with other users.
          </p>

          <h3 className="font-semibold mt-4 mb-2">7.3 Content Responsibility</h3>
          <p>
            You are solely responsible for Your Content and the consequences of publishing it. We
            reserve the right to remove content that violates these Terms or applicable law.
          </p>
        </section>

        {/* 8 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">8. Third-Party Services and Social Platforms</h2>
          <p>
            The Service connects to third-party social media platforms (Facebook, Instagram, LinkedIn,
            X/Twitter, Discord, WordPress, and others). Your use of those platforms is governed by
            their respective terms of service. We are not responsible for their availability, actions,
            or policy changes.
          </p>
          <p className="mt-3">
            OAuth access tokens for connected social accounts are stored securely and used only to
            publish content on your behalf as directed by you. You may revoke access at any time from
            your {COMPANY_NAME} settings or from the third-party platform.
          </p>
        </section>

        {/* 9 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">9. Intellectual Property</h2>
          <p>
            The Service, its design, code, trademarks, and all content produced by {COMPANY_NAME}
            (excluding Your Content) are the exclusive property of Liviu Stoica or its licensors. You
            may not copy, modify, distribute, or create derivative works of the Service without our
            prior written consent.
          </p>
        </section>

        {/* 10 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">10. Availability and Service Changes</h2>
          <p>
            We strive for high availability but do not guarantee uninterrupted access. We may modify,
            suspend, or discontinue the Service (or any part of it) at any time with reasonable
            notice. For material changes that affect paid subscribers, we will provide at least 30
            days&rsquo; notice via the email address on file.
          </p>
        </section>

        {/* 11 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">11. Disclaimer of Warranties</h2>
          <p>
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
            warranties of any kind, express or implied, including but not limited to warranties of
            merchantability, fitness for a particular purpose, and non-infringement. We do not
            warrant that the Service will be error-free, uninterrupted, or free from viruses or
            other harmful components.
          </p>
        </section>

        {/* 12 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">12. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, {COMPANY_NAME} and its operators shall
            not be liable for any indirect, incidental, special, consequential, or punitive damages,
            including but not limited to loss of profits, data, business, or goodwill, arising out of
            or in connection with your use of or inability to use the Service.
          </p>
          <p className="mt-3">
            Our total liability to you for any claim arising out of these Terms or the Service shall
            not exceed the amount you paid us in the 12 months preceding the claim, or €50 if you
            have not made any payments.
          </p>
        </section>

        {/* 13 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">13. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless {COMPANY_NAME} and its operators from any
            claims, damages, losses, or expenses (including reasonable legal fees) arising from your
            use of the Service, Your Content, your violation of these Terms, or your violation of any
            third-party rights.
          </p>
        </section>

        {/* 14 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">14. Termination</h2>
          <p>
            You may cancel your subscription and delete your account at any time from account
            settings. Cancellation stops future billing; access continues until the end of the current
            paid period.
          </p>
          <p className="mt-3">
            We may suspend or terminate your account at any time for a material breach of these Terms,
            after reasonable notice where practicable. Upon termination, your right to use the Service
            ceases immediately. We may retain your data as described in the Privacy Policy.
          </p>
        </section>

        {/* 15 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">15. Governing Law and Disputes</h2>
          <p>
            These Terms are governed by the laws of Romania without regard to conflict-of-law
            principles. Any dispute arising from these Terms or the Service shall be submitted to the
            competent courts of Romania. If you are a consumer in the EU, you may also use the EU
            Online Dispute Resolution platform at{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              ec.europa.eu/consumers/odr
            </a>
            .
          </p>
        </section>

        {/* 16 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">16. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify you of material changes via
            email or an in-app notice at least 14 days before the changes take effect. Continued use
            of the Service after the effective date constitutes acceptance of the updated Terms.
          </p>
        </section>

        {/* 17 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">17. Contact</h2>
          <p>
            If you have questions about these Terms, contact us at:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a>
          </p>
        </section>

      </div>
    </div>
  );
}
