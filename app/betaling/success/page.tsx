import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Betaling geslaagd — Blueprint",
  description: "Uw betaling is succesvol ontvangen. Bedankt!",
};

export default function BetalingSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8 sm:p-12 text-center">
          {/* Green checkmark */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Betaling ontvangen
          </h1>

          {/* Message */}
          <p className="text-gray-500 text-lg leading-relaxed mb-2">
            Bedankt voor uw betaling.
          </p>
          <p className="text-gray-400 text-sm mb-8">
            U ontvangt een bevestiging per e-mail. De betaling wordt momenteel verwerkt.
          </p>

          {/* Divider */}
          <div className="border-t border-gray-100 pt-6 space-y-3">
            <Link
              href="/"
              className="block bg-blue-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Terug naar homepage
            </Link>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Betalingen worden veilig verwerkt door{" "}
          <a
            href="https://www.mollie.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 transition-colors"
          >
            Mollie
          </a>
          . Powered by Blueprint.
        </p>
      </div>
    </div>
  );
}
