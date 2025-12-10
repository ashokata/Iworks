const fs = require('fs');
const path = require('path');

const content = `'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function CustomerViewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  useEffect(() => {
    // Redirect to the pet-customers view page with the same ID
    if (id) {
      router.push(\`/pet-customers/view/\${id}\`);
    } else {
      router.push('/pet-customers');
    }
  }, [router, id]);

  // Simple loading state while redirecting
  return (
    <div className="p-8 flex justify-center items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}`;

fs.writeFileSync(path.join(__dirname, 'src/app/customers/view/[id]/page.tsx'), content, 'utf8');
console.log('File updated successfully!');
