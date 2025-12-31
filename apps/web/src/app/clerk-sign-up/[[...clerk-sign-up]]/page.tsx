import { SignUp } from '@clerk/nextjs';

export default function ClerkSignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create an account with Clerk
          </h1>
          <p className="text-gray-600">
            Experience the new authentication system
          </p>
          <p className="text-sm text-blue-600 mt-2">
            <a href="/register" className="underline">
              Use legacy registration instead →
            </a>
          </p>
        </div>

        <SignUp
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
          path="/clerk-sign-up"
          signInUrl="/clerk-sign-in"
        />
      </div>
    </div>
  );
}