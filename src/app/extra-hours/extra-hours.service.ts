import { Injectable } from '@angular/core';
import { supabase } from '../supabase-client';
import { OvertimeEntry, TeamMember } from './extra-hours.model';

@Injectable({ providedIn: 'root' })
export class ExtraHoursService {
  private supabase = supabase;

  async getMembers(): Promise<TeamMember[]> {
    const { data, error } = await this.supabase.from('team_members').select('*').order('name');
    if (error) throw error;
    return data;
  }

  async createMember(name: string): Promise<TeamMember> {
    const { data, error } = await this.supabase
      .from('team_members')
      .insert({ name })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteMember(memberId: string): Promise<void> {
    const { error } = await this.supabase.from('team_members').delete().eq('id', memberId);
    if (error) throw error;
  }

  async getEntries(): Promise<OvertimeEntry[]> {
    const { data, error } = await this.supabase
      .from('overtime_entries')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  }

  async createEntry(entry: Omit<OvertimeEntry, 'id' | 'created_at'>): Promise<OvertimeEntry> {
    const { data, error } = await this.supabase
      .from('overtime_entries')
      .insert(entry)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteEntry(entryId: string): Promise<void> {
    const { error } = await this.supabase.from('overtime_entries').delete().eq('id', entryId);
    if (error) throw error;
  }
}
