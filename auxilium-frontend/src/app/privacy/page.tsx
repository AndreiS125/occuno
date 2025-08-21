import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Occuno",
  description: "Privacy Policy for Occuno - AI-powered planning platform",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-6 py-16 max-w-4xl">
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
          <p>
            Welcome to Occuno ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered planning platform at occuno.com.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          
          <h3 className="text-xl font-medium mb-3">Personal Information</h3>
          <p>We may collect the following personal information:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Name and email address when you create an account</li>
            <li>Profile information you choose to provide</li>
            <li>Communication preferences and settings</li>
            <li>Payment information (processed securely through third-party providers)</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">Usage Information</h3>
          <p>We automatically collect certain information about your use of our service:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Log data including IP address, browser type, and operating system</li>
            <li>Device information and unique identifiers</li>
            <li>Usage patterns and feature interactions</li>
            <li>Performance metrics and error reports</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">Planning Data</h3>
          <p>To provide our AI-powered planning services, we collect:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Objectives, tasks, and goals you create</li>
            <li>Calendar events and scheduling data</li>
            <li>Progress tracking and completion status</li>
            <li>Notes and descriptions you add to your plans</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide, maintain, and improve our AI planning services</li>
            <li>Personalize your experience and provide relevant recommendations</li>
            <li>Process transactions and manage your account</li>
            <li>Send important updates about your account and our services</li>
            <li>Provide customer support and respond to your inquiries</li>
            <li>Analyze usage patterns to enhance our platform</li>
            <li>Ensure security and prevent fraud or abuse</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Information Sharing and Disclosure</h2>
          <p>We do not sell, trade, or rent your personal information. We may share your information only in the following circumstances:</p>
          
          <h3 className="text-xl font-medium mb-3">Service Providers</h3>
          <p>We may share information with trusted third-party service providers who assist us in operating our platform, such as:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Cloud hosting and infrastructure providers</li>
            <li>Payment processing services</li>
            <li>Analytics and monitoring tools</li>
            <li>Customer support platforms</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">Legal Requirements</h3>
          <p>We may disclose your information if required by law or in response to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Valid legal processes or government requests</li>
            <li>Enforcement of our terms of service</li>
            <li>Protection of our rights, property, or safety</li>
            <li>Prevention of fraud or illegal activities</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">Business Transfers</h3>
          <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
          <p>We implement industry-standard security measures to protect your information:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>Access controls and authentication requirements</li>
            <li>Secure data centers with physical and digital protections</li>
            <li>Employee training on data protection best practices</li>
          </ul>
          <p>However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Rights and Choices</h2>
          <p>You have the following rights regarding your personal information:</p>
          
          <h3 className="text-xl font-medium mb-3">Access and Portability</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Request access to your personal information</li>
            <li>Export your data in a portable format</li>
            <li>Receive copies of your planning data</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">Correction and Updates</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Update your profile and account information</li>
            <li>Correct inaccurate or incomplete data</li>
            <li>Modify your communication preferences</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">Deletion</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Request deletion of your account and associated data</li>
            <li>Remove specific information from your profile</li>
            <li>Opt out of certain data collection practices</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Cookies and Tracking</h2>
          <p>We use cookies and similar technologies to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Remember your preferences and settings</li>
            <li>Analyze website traffic and usage patterns</li>
            <li>Provide personalized content and recommendations</li>
            <li>Ensure security and prevent fraud</li>
          </ul>
          <p>You can control cookie settings through your browser preferences. Please see our Cookie Policy for more detailed information.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards to protect your information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
          <p>
            Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it promptly.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p>If you have any questions about this Privacy Policy or our data practices, please contact us at:</p>
          <div className="bg-muted p-4 rounded-lg mt-4">
            <p><strong>Email:</strong> privacy@occuno.com</p>
            <p><strong>Website:</strong> occuno.com</p>
          </div>
        </section>
      </div>
    </div>
  );
}
