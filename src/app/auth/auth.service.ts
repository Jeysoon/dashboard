import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { supabase } from '../supabase-client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<User | null>(null);

  constructor(private router: Router) {
    supabase.auth.onAuthStateChange((event, session) => {
      this.user.set(session?.user ?? null);
      if (event === 'SIGNED_OUT') this.router.navigate(['/login']);
    });
  }

  // UI gate only; the database enforces the same rule through RLS (public.is_admin()).
  async isAdmin(): Promise<boolean> {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return false;
    const { data: row, error } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;
    return !!row;
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!(await this.isAdmin())) {
      await supabase.auth.signOut();
      throw new Error('This account does not have administrator access.');
    }
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }
}
