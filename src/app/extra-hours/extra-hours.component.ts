import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { OvertimeEntry, OvertimeKind, TeamMember } from './extra-hours.model';
import { ExtraHoursService } from './extra-hours.service';

interface MemberSummary {
  member: TeamMember;
  worked: number;
  requested: number;
  balance: number;
}

@Component({
  selector: 'app-extra-hours',
  imports: [
    FormsModule,
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './extra-hours.component.html',
  styleUrl: './extra-hours.component.scss',
})
export class ExtraHoursComponent implements OnInit {
  readonly members = signal<TeamMember[]>([]);
  readonly entries = signal<OvertimeEntry[]>([]);
  readonly selectedId = signal<string | null>(null);

  readonly summaries = computed<MemberSummary[]>(() =>
    this.members().map((member) => {
      const own = this.entries().filter((e) => e.member_id === member.id);
      const sum = (kind: OvertimeKind) =>
        own.filter((e) => e.kind === kind).reduce((total, e) => total + Number(e.hours), 0);
      const worked = sum('worked');
      const requested = sum('requested');
      return { member, worked, requested, balance: worked - requested };
    }),
  );

  readonly selected = computed(
    () => this.summaries().find((s) => s.member.id === this.selectedId()) ?? null,
  );

  readonly selectedEntries = computed(() =>
    this.entries().filter((e) => e.member_id === this.selectedId()),
  );

  newMemberName = '';
  entryKind: OvertimeKind = 'worked';
  entryDate = today();
  entryHours: number | null = null;
  entryNote = '';

  constructor(private service: ExtraHoursService) {}

  async ngOnInit(): Promise<void> {
    const [members, entries] = await Promise.all([
      this.service.getMembers(),
      this.service.getEntries(),
    ]);
    this.members.set(members);
    this.entries.set(entries);
    if (members.length) this.selectedId.set(members[0].id);
  }

  async addMember(): Promise<void> {
    const name = this.newMemberName.trim();
    if (!name) return;
    const member = await this.service.createMember(name);
    this.members.update((list) => [...list, member].sort((a, b) => a.name.localeCompare(b.name)));
    this.selectedId.set(member.id);
    this.newMemberName = '';
  }

  async deleteMember(member: TeamMember): Promise<void> {
    if (!confirm(`Delete ${member.name} and all their extra hours records?`)) return;
    await this.service.deleteMember(member.id);
    this.members.update((list) => list.filter((m) => m.id !== member.id));
    this.entries.update((list) => list.filter((e) => e.member_id !== member.id));
    if (this.selectedId() === member.id) this.selectedId.set(this.members()[0]?.id ?? null);
  }

  canAddEntry(): boolean {
    return !!this.selectedId() && !!this.entryDate && !!this.entryHours && this.entryHours > 0;
  }

  async addEntry(): Promise<void> {
    const memberId = this.selectedId();
    if (!memberId || !this.canAddEntry()) return;
    const entry = await this.service.createEntry({
      member_id: memberId,
      kind: this.entryKind,
      hours: this.entryHours!,
      date: this.entryDate,
      note: this.entryNote.trim(),
    });
    this.entries.update((list) => [entry, ...list].sort((a, b) => b.date.localeCompare(a.date)));
    this.entryHours = null;
    this.entryNote = '';
  }

  async deleteEntry(entry: OvertimeEntry): Promise<void> {
    if (!confirm('Delete this record?')) return;
    await this.service.deleteEntry(entry.id);
    this.entries.update((list) => list.filter((e) => e.id !== entry.id));
  }
}

function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
