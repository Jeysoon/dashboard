import { Injectable } from '@angular/core';
import { Card, CardHistory, KanbanColumn } from '../models/card.model';
import { supabase } from '../../supabase-client';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase = supabase;

  async getCards(): Promise<Card[]> {
    const { data, error } = await this.supabase
      .from('cards')
      .select('*')
      .order('position');
    if (error) throw error;
    return data;
  }

  async createCard(card: Omit<Card, 'id' | 'created_at'>): Promise<Card> {
    const { data, error } = await this.supabase
      .from('cards')
      .insert(card)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateCard(
    cardId: string,
    changes: Pick<Card, 'title' | 'description'>,
  ): Promise<void> {
    const { error } = await this.supabase.from('cards').update(changes).eq('id', cardId);
    if (error) throw error;
  }

  async updateCardColumn(
    cardId: string,
    column: KanbanColumn,
    position: number,
  ): Promise<void> {
    const { error } = await this.supabase
      .from('cards')
      .update({ column, position })
      .eq('id', cardId);
    if (error) throw error;
  }

  async updateCardPositions(
    updates: { id: string; position: number }[],
  ): Promise<void> {
    const { error } = await this.supabase.rpc('update_card_positions', {
      updates,
    });
    if (error) throw error;
  }

  async deleteCard(cardId: string): Promise<void> {
    const { error } = await this.supabase.from('cards').delete().eq('id', cardId);
    if (error) throw error;
  }

  async getCardHistory(cardId: string): Promise<CardHistory[]> {
    const { data, error } = await this.supabase
      .from('card_history')
      .select('*')
      .eq('card_id', cardId)
      .order('moved_at', { ascending: true });
    if (error) throw error;
    return data;
  }

  async addHistoryEntry(
    cardId: string,
    fromColumn: KanbanColumn,
    toColumn: KanbanColumn,
  ): Promise<void> {
    const { error } = await this.supabase.from('card_history').insert({
      card_id: cardId,
      from_column: fromColumn,
      to_column: toColumn,
    });
    if (error) throw error;
  }

}
