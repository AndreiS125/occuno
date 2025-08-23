import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy - Occuno",
  description: "Cookie Policy for Occuno - AI-powered planning platform",
};

export default function CookiePolicyPage() {
  return (
    <div className="container mx-auto px-6 py-16 max-w-4xl">
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What Are Cookies</h2>
          <p>
            Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences, analyzing how you use our service, and improving our platform's functionality.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How We Use Cookies</h2>
          <p>Occuno uses cookies for the following purposes:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Authentication and security</li>
            <li>Remembering your preferences and settings</li>
            <li>Analyzing website performance and usage</li>
            <li>Providing personalized content and features</li>
            <li>Improving our AI planning algorithms</li>
            <li>Preventing fraud and ensuring platform security</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Types of Cookies We Use</h2>
          
          <h3 className="text-xl font-medium mb-3">Essential Cookies</h3>
          <p>These cookies are necessary for the website to function properly and cannot be disabled:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Authentication cookies:</strong> Keep you logged in and secure</li>
            <li><strong>Security cookies:</strong> Protect against cross-site request forgery</li>
            <li><strong>Session cookies:</strong> Maintain your session state</li>
            <li><strong>Load balancing cookies:</strong> Ensure optimal performance</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">Functional Cookies</h3>
          <p>These cookies enhance your experience by remembering your choices:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Preference cookies:</strong> Remember your settings and preferences</li>
            <li><strong>Theme cookies:</strong> Save your dark/light mode preference</li>
            <li><strong>Language cookies:</strong> Remember your language selection</li>
            <li><strong>Dashboard cookies:</strong> Remember your dashboard layout</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">Analytics Cookies</h3>
          <p>These cookies help us understand how you use our platform:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Usage analytics:</strong> Track feature usage and user flows</li>
            <li><strong>Performance monitoring:</strong> Monitor page load times and errors</li>
            <li><strong>A/B testing:</strong> Test different versions of features</li>
            <li><strong>Conversion tracking:</strong> Measure the effectiveness of our features</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">Marketing Cookies</h3>
          <p>These cookies help us provide relevant content and measure marketing effectiveness:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Advertising cookies:</strong> Show relevant ads on other websites</li>
            <li><strong>Social media cookies:</strong> Enable social sharing features</li>
            <li><strong>Campaign tracking:</strong> Measure marketing campaign performance</li>
            <li><strong>Retargeting cookies:</strong> Show relevant content to returning visitors</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Third-Party Cookies</h2>
          <p>We may use third-party services that set their own cookies:</p>
          
          <h3 className="text-xl font-medium mb-3">Google Services</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Google Analytics:</strong> Website traffic analysis</li>
            <li><strong>Google OAuth:</strong> Secure authentication</li>
            <li><strong>Google Calendar:</strong> Calendar integration</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">Other Services</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Payment processors:</strong> Secure payment handling</li>
            <li><strong>CDN providers:</strong> Fast content delivery</li>
            <li><strong>Support platforms:</strong> Customer service tools</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Cookie Duration</h2>
          <p>Cookies may be stored for different periods:</p>
          
          <h3 className="text-xl font-medium mb-3">Session Cookies</h3>
          <p>These cookies are deleted when you close your browser and are used for:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Maintaining your login session</li>
            <li>Temporary preferences during your visit</li>
            <li>Shopping cart contents</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">Persistent Cookies</h3>
          <p>These cookies remain on your device for a specified period:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>30 days:</strong> Authentication and security cookies</li>
            <li><strong>1 year:</strong> Preference and functional cookies</li>
            <li><strong>2 years:</strong> Analytics and performance cookies</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Managing Your Cookie Preferences</h2>
          
          <h3 className="text-xl font-medium mb-3">Browser Settings</h3>
          <p>You can control cookies through your browser settings:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
            <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
            <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
            <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">Cookie Consent</h3>
          <p>When you first visit our website, we'll ask for your consent to use non-essential cookies. You can:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Accept all cookies for the full experience</li>
            <li>Reject non-essential cookies</li>
            <li>Customize your preferences by cookie type</li>
            <li>Change your preferences at any time in your account settings</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">Opt-Out Links</h3>
          <p>You can opt out of specific tracking services:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Google Analytics:</strong> <a href="https://tools.google.com/dlpage/gaoptout" className="text-primary hover:underline">Google Analytics Opt-out</a></li>
            <li><strong>Google Ads:</strong> <a href="https://www.google.com/settings/ads" className="text-primary hover:underline">Google Ad Settings</a></li>
            <li><strong>Network Advertising Initiative:</strong> <a href="http://www.networkadvertising.org/choices/" className="text-primary hover:underline">NAI Opt-out</a></li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Impact of Disabling Cookies</h2>
          <p>If you disable cookies, some features may not work properly:</p>
          
          <h3 className="text-xl font-medium mb-3">Essential Cookies</h3>
          <p>Disabling essential cookies may result in:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Inability to log in or stay logged in</li>
            <li>Security vulnerabilities</li>
            <li>Loss of session data</li>
            <li>Reduced functionality</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">Non-Essential Cookies</h3>
          <p>Disabling non-essential cookies may result in:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Less personalized experience</li>
            <li>Repeated requests for preferences</li>
            <li>Less relevant content recommendations</li>
            <li>Inability to track your progress across sessions</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time to reflect changes in our practices or for legal and regulatory reasons. We will notify you of any material changes by posting the updated policy on our website and updating the "Last updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p>If you have any questions about our use of cookies or this Cookie Policy, please contact us:</p>
          <div className="bg-muted p-4 rounded-lg mt-4">
            <p><strong>Email:</strong> privacy@occuno.com</p>
            <p><strong>Website:</strong> occuno.com</p>
          </div>
        </section>
      </div>
    </div>
  );
}
