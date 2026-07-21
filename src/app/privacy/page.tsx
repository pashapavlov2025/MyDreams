export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: March 26, 2026</p>

      <div className="space-y-6 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Overview</h2>
          <p>
            MyDreams is a personal finance tracker that operates entirely on your
            device. We do not collect, store, or transmit any personal information.
            Your financial data never leaves your device.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Data Storage</h2>
          <p>
            All data you enter into MyDreams — including account balances,
            investment projects, and settings — is stored locally on your device
            using IndexedDB. There is no server, no cloud storage, and no remote
            database. If you delete the app or clear your browser data, your data
            will be permanently removed.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No Accounts or Authentication</h2>
          <p>
            MyDreams does not require you to create an account, provide an email
            address, or sign in. The optional PIN lock is stored locally on your
            device and is never transmitted anywhere.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Network Requests</h2>
          <p>
            The app makes network requests solely to fetch currency exchange rates
            from two public APIs:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>
              <strong>frankfurter.app</strong> — for fiat currency rates
            </li>
            <li>
              <strong>CoinGecko API</strong> — for cryptocurrency rates
            </li>
          </ul>
          <p className="mt-2">
            These requests contain no personal or identifying information. Only the
            currency pair is sent (e.g., &quot;USD to EUR&quot;). No cookies, tokens, or
            device identifiers are included.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Analytics and Tracking</h2>
          <p>
            MyDreams does not use any analytics services, tracking pixels,
            advertising SDKs, or similar technologies. We do not collect usage
            data, crash reports, or device information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Third-Party Sharing</h2>
          <p>
            We do not share any data with third parties because we do not have
            access to any of your data in the first place.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Children&apos;s Privacy</h2>
          <p>
            MyDreams is not directed at children under 13. Since the app does not
            collect any personal information, no data from children is collected.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Changes to This Policy</h2>
          <p>
            If this privacy policy is updated, the changes will be reflected on
            this page with an updated date. Since no data is collected, changes are
            unlikely.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact</h2>
          <p>
            If you have questions about this privacy policy, please open an issue
            on the project&apos;s GitHub repository.
          </p>
        </section>
      </div>
    </div>
  );
}
