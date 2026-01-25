'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/home');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-black">
            <div className="text-white text-sm animate-pulse">Redirecting...</div>
        </div>
    );
}
