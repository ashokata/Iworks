import { SignIn } from '@clerk/nextjs';

export default function ClerkSignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sign in with Clerk
          </h1>
          <p className="text-gray-600">
            This is the new Clerk authentication system (POC)
          </p>
          <p className="text-sm text-blue-600 mt-2">
            <a href="/login" className="underline">
              Use legacy login instead →
            </a>
          </p>
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-white shadow-lg',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              socialButtonsBlockButton:
                'border-gray-300 hover:bg-gray-50 hover:border-gray-400',
              formFieldInput:
                'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
              formButtonPrimary:
                'bg-blue-600 hover:bg-blue-700 text-white',
              footerActionLink:
                'text-blue-600 hover:text-blue-700',
            },
          }}
          routing="path"
          path="/clerk-sign-in"
          signUpUrl="/clerk-sign-up"
        />
      </div>
    </div>
  );
}