'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const checkRes = await fetch('/api/check-user-exists');
      const { exists } = await checkRes.json();
      if (exists) {
        toast.error('This system is already configured for one user. Contact the owner.');
        return;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: name || 'Fredrick Ochieng' }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Registration failed');
      }

      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) throw new Error('Account created but login failed — try logging in.');

      toast.success('Welcome to your Life OS!');
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-2xl border-slate-700 bg-slate-900/80 backdrop-blur text-white">
      <CardHeader className="space-y-1 text-center">
        <div className="text-4xl mb-2">🎯</div>
        <CardTitle className="text-2xl font-bold text-white">Create Your Life OS</CardTitle>
        <CardDescription className="text-slate-400">Set up your personal command center</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-200">Your Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Fredrick Ochieng"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-200">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-200">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</> : 'Create Life OS'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:underline">Sign in</Link>
        </p>
      </CardFooter>
    </Card>
  );
}
