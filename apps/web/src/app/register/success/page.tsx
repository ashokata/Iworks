"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function RegisterSuccessContent() {
  const searchParams = useSearchParams();
  const tenantName = searchParams.get("tenantName") || "your company";
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-8 w-8 text-green-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-6">
            {tenantName} has been successfully registered on our platform.
            Your administrator account has been created and an email with login instructions
            has been sent to the provided email address.
          </p>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
            <p className="font-medium mb-1">Next steps:</p>
            <ul className="list-disc list-inside text-left">
              <li>Check your email for login instructions</li>
              <li>Sign in with your administrator account</li>
              <li>Complete your company profile</li>
              <li>Add team members to your workspace</li>
            </ul>
          </div>
          
          <div className="flex flex-col space-y-3">
            <Link href="/login">
              <Button className="w-full">
                Go to Login
              </Button>
            </Link>
            <a href="mailto:support@windsurf.com">
              <Button 
                variant="outline" 
                className="w-full"
              >
                Contact Support
              </Button>
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function RegisterSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <RegisterSuccessContent />
    </Suspense>
  );
}
