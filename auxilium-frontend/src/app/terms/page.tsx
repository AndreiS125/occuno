import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Occuno",
  description: "Terms of Service for Occuno - AI-powered planning platform",
};

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-6 py-16 max-w-4xl">
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Agreement to Terms</h2>
          <p>
            By accessing and using Occuno ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Description of Service</h2>
          <p>
            Occuno is an AI-powered planning and productivity platform that helps users organize objectives, manage tasks, schedule activities, and track progress. Our service includes web-based applications, mobile applications, and related features.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">User Accounts</h2>
          
          <h3 className="text-xl font-medium mb-3">Account Creation</h3>
          <p>To use certain features of our Service, you must create an account. You agree to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide accurate, current, and complete information</li>
            <li>Maintain and update your account information</li>
            <li>Keep your password secure and confidential</li>
            <li>Accept responsibility for all activities under your account</li>
            <li>Notify us immediately of any unauthorized use</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">Account Eligibility</h3>
          <p>You must be at least 13 years old to use our Service. If you are under 18, you must have parental consent.</p>

          <h3 className="text-xl font-medium mb-3">Account Termination</h3>
          <p>We reserve the right to suspend or terminate your account if you violate these Terms or engage in harmful activities.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Acceptable Use</h2>
          
          <h3 className="text-xl font-medium mb-3">Permitted Uses</h3>
          <p>You may use our Service for:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Personal and business planning and productivity</li>
            <li>Creating and managing objectives and tasks</li>
            <li>Scheduling and calendar management</li>
            <li>Progress tracking and analytics</li>
            <li>Collaboration with team members (where applicable)</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">Prohibited Uses</h3>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Use the Service for any illegal or unauthorized purpose</li>
            <li>Violate any laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Upload malicious code, viruses, or harmful content</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Use automated tools to access the Service without permission</li>
            <li>Share your account credentials with others</li>
            <li>Create multiple accounts to circumvent restrictions</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">User Content</h2>
          
          <h3 className="text-xl font-medium mb-3">Your Content</h3>
          <p>You retain ownership of all content you create, upload, or share through our Service, including:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Objectives, tasks, and planning data</li>
            <li>Notes, descriptions, and comments</li>
            <li>Files and documents you upload</li>
            <li>Calendar events and scheduling information</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">License to Us</h3>
          <p>By using our Service, you grant us a limited, non-exclusive license to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Store and process your content to provide the Service</li>
            <li>Use your content to improve our AI algorithms (in anonymized form)</li>
            <li>Display your content back to you and authorized users</li>
            <li>Make backups and ensure data security</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">Content Standards</h3>
          <p>Your content must not:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on third-party rights</li>
            <li>Contain harmful, offensive, or inappropriate material</li>
            <li>Include personal information of others without consent</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Subscription and Payment</h2>
          
          <h3 className="text-xl font-medium mb-3">Subscription Plans</h3>
          <p>We offer various subscription plans with different features and usage limits. Current pricing and features are available on our website.</p>

          <h3 className="text-xl font-medium mb-3">Payment Terms</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Subscription fees are billed in advance</li>
            <li>All fees are non-refundable unless otherwise stated</li>
            <li>We may change pricing with 30 days' notice</li>
            <li>Failed payments may result in service suspension</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">Free Trial</h3>
          <p>We may offer free trials for new users. Trial limitations and conversion terms will be clearly communicated.</p>

          <h3 className="text-xl font-medium mb-3">Cancellation</h3>
          <p>You may cancel your subscription at any time. Service will continue until the end of your current billing period.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Intellectual Property</h2>
          
          <h3 className="text-xl font-medium mb-3">Our Rights</h3>
          <p>Occuno and all related intellectual property are owned by us, including:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Software, algorithms, and AI models</li>
            <li>User interface and design elements</li>
            <li>Trademarks, logos, and branding</li>
            <li>Documentation and content we create</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">Third-Party Rights</h3>
          <p>Our Service may include third-party content or integrations. You must respect all applicable intellectual property rights.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Privacy and Data Protection</h2>
          <p>
            Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Service Availability</h2>
          
          <h3 className="text-xl font-medium mb-3">Uptime</h3>
          <p>We strive to maintain high service availability but cannot guarantee 100% uptime. We may perform maintenance that temporarily affects service availability.</p>

          <h3 className="text-xl font-medium mb-3">Changes to Service</h3>
          <p>We reserve the right to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Modify, update, or discontinue features</li>
            <li>Change system requirements</li>
            <li>Update our algorithms and AI models</li>
            <li>Implement new security measures</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Disclaimers</h2>
          
          <h3 className="text-xl font-medium mb-3">Service Provided "As Is"</h3>
          <p>Our Service is provided on an "as is" and "as available" basis. We disclaim all warranties, express or implied, including:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Warranties of merchantability and fitness for a particular purpose</li>
            <li>Warranties of non-infringement</li>
            <li>Warranties regarding accuracy or completeness of content</li>
            <li>Warranties regarding uninterrupted or error-free operation</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">AI Limitations</h3>
          <p>Our AI-powered features are designed to assist with planning but:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>May not always provide accurate or complete recommendations</li>
            <li>Should not be relied upon for critical decisions without human review</li>
            <li>Are continuously improved but may have limitations</li>
            <li>May not be suitable for all use cases or industries</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities, arising from your use of our Service.
          </p>
          <p>
            Our total liability for any claims related to the Service shall not exceed the amount you paid us in the 12 months preceding the claim.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Indemnification</h2>
          <p>
            You agree to indemnify and hold us harmless from any claims, damages, or expenses arising from your use of the Service, violation of these Terms, or infringement of third-party rights.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Dispute Resolution</h2>
          
          <h3 className="text-xl font-medium mb-3">Governing Law</h3>
          <p>These Terms are governed by the laws of [Your Jurisdiction], without regard to conflict of law principles.</p>

          <h3 className="text-xl font-medium mb-3">Arbitration</h3>
          <p>Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration, except for claims that may be brought in small claims court.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify you of material changes by email or through the Service. Your continued use of the Service after changes become effective constitutes acceptance of the new Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Termination</h2>
          <p>
            Either party may terminate this agreement at any time. Upon termination, your right to use the Service ceases immediately. We will provide reasonable access to export your data for a limited time after termination.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Severability</h2>
          <p>
            If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
          <p>If you have any questions about these Terms, please contact us:</p>
          <div className="bg-muted p-4 rounded-lg mt-4">
            <p><strong>Email:</strong> legal@occuno.com</p>
            <p><strong>Website:</strong> occuno.com</p>
          </div>
        </section>
      </div>
    </div>
  );
}
