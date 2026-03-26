import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ShotService } from '../../services/shot.service';
import { ShotDTO } from '../../models/shot.model';
import { CrudMenuComponent } from '../../components/crud-menu/crud-menu';
import { HorseService } from '../../services/horse.service';
import { HorseDTO } from '../../models/horse.model';

@Component({
  selector: 'app-shot-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudMenuComponent],
  templateUrl: './shot-profile.html',
  styleUrls: ['./shot-profile.css']
})
export class ShotProfilePage implements OnInit {
  shot?: ShotDTO;
  loading = true;
  error: string | null = null;
  horses: HorseDTO[] = [];
  treatedHorses: HorseDTO[] = [];

  editHorsesMode = false;
  selectedHorseIds: Set<number> = new Set();
  saving = false;
  successMessage = '';
  plannedDueDate: string | null = null;
  markDueCompleted = false;
  completedDate = '';
  nextPlannedDates: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private shotService: ShotService,
    private horseService: HorseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('shotId'));
    if (!id) {
      this.error = 'Érvénytelen oltás azonosító.';
      this.loading = false;
      return;
    }

    const dueDateParam = this.route.snapshot.queryParamMap.get('dueDate');
    this.plannedDueDate = dueDateParam;
    if (this.plannedDueDate) {
      this.completedDate = this.plannedDueDate;
      this.markDueCompleted = false;
    }

    this.loadShot(id);
  }

  loadShot(id: number): void {
    this.loading = true;

    this.shotService.getById(id).subscribe({
      next: (data) => {
        this.shot = data;
        this.nextPlannedDates = this.buildNextPlannedDates(this.shot, 3);

        this.horseService.getAll().subscribe({
          next: (horses) => {
            this.horses = horses;

            this.treatedHorses = horses.filter(
              h => this.shot!.horseIds?.includes(h.id!)
            );

            this.selectedHorseIds = new Set(this.shot!.horseIds || []);

            this.loading = false;
          },
          error: () => {
            this.error = 'Nem sikerült betölteni a lovakat.';
            this.loading = false;
          }
        });
        this.loading = false;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni az oltást.';
        this.loading = false;
      }
    });
  }

  frequencyLabels: { [key: string]: string } = {
    DAYS: 'Nap',
    WEEKS: 'Hét',
    MONTHS: 'Hónap',
    YEARS: 'Év'
  };

  getFrequencyLabel(): string {
    if (!this.shot || !this.shot.frequencyValue || !this.shot.frequencyUnit) return '-';

    const unitLabel = this.frequencyLabels[this.shot.frequencyUnit] || this.shot.frequencyUnit;
    return `${this.shot.frequencyValue} ${unitLabel}`;
  }

  getHorseNameById(id: number): string | null {
    const horse = this.horses.find(h => h.id === id);
    return horse ? horse.horseName : null;
  }

  getKnownHorseIds(ids?: number[] | null): number[] {
    if (!ids || ids.length === 0) return [];
    const known = new Set(this.horses.map(h => h.id));
    return ids.filter(id => known.has(id));
  }

  goBack(): void {
    if (history.state?.fromEdit) {
      this.router.navigate(['/shots']);
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/shots']);
    }
  }

  goToHorseProfile(horseName: string) {
    this.router.navigate(['/horses', horseName]);
  }

  editShot(): void {
    this.editHorsesMode = true;
  }

  deleteShot(): void {
    if (!this.shot?.shotId) return;

    if (!confirm('Biztosan törlöd ezt az oltást?')) return;

    this.shotService.delete(this.shot.shotId).subscribe({
      next: () => {
        this.router.navigate(['/shots']);
      },
      error: () => {
        alert('Nem sikerült törölni az oltást.');
      }
    });
  }

  toggleHorseAssignment(horseId: number) {
    if (this.selectedHorseIds.has(horseId)) {
      this.selectedHorseIds.delete(horseId);
    } else {
      this.selectedHorseIds.add(horseId);
    }
  }

  saveHorseAssignments() {
    if (!this.shot?.shotId) return;
    this.saving = true;

    const dto: Partial<ShotDTO> = {
      shotName: this.shot?.shotName ?? '',
      date: this.shot?.date ?? '',
      frequencyUnit: this.shot?.frequencyUnit ?? null,
      frequencyValue: this.shot?.frequencyValue ?? null,
      horseIds: Array.from(this.selectedHorseIds)
    };

    this.shotService.update(this.shot.shotId, dto as ShotDTO).subscribe({
      next: () => {
        this.successMessage = 'Lovak sikeresen frissítve.';
        this.saving = false;
        this.editHorsesMode = false;

        this.shot!.horseIds = Array.from(this.selectedHorseIds);
        this.treatedHorses = this.horses.filter(h =>
          this.selectedHorseIds.has(h.id!)
        );

        setTimeout(() => this.successMessage = '', 2000);
      },
      error: () => {
        this.error = 'Nem sikerült frissíteni a lovakat.';
        this.saving = false;
      }
    });
  }

  confirmDueShot(): void {
    if (!this.shot?.shotId) return;
    if (!this.markDueCompleted) return;
    if (!this.completedDate) {
      this.error = 'Add meg az oltás dátumát.';
      return;
    }

    const dto: Partial<ShotDTO> = {
      shotName: this.shot?.shotName ?? '',
      date: this.completedDate,
      frequencyUnit: this.shot?.frequencyUnit ?? null,
      frequencyValue: this.shot?.frequencyValue ?? null,
      horseIds: this.shot?.horseIds ?? []
    };

    this.saving = true;
    this.shotService.update(this.shot.shotId, dto as ShotDTO).subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = 'Az oltás dátuma frissítve.';
        this.shot!.date = this.completedDate;
        this.nextPlannedDates = this.buildNextPlannedDates(this.shot!, 3);
        this.plannedDueDate = null;
        this.markDueCompleted = false;
        setTimeout(() => this.successMessage = '', 2000);
      },
      error: () => {
        this.error = 'Nem sikerült frissíteni az oltást.';
        this.saving = false;
      }
    });
  }

  get crudActions() {
    return [
      {
        label: 'Csatolt lovak szerkesztése',
        icon: 'fa-pen-to-square',
        onClick: () => {
          this.editHorsesMode = true;
        }
      },
      {
        label: 'Oltás törlése',
        icon: 'fa-trash',
        onClick: () => this.deleteShot(),
      }
    ];
  }

  private buildNextPlannedDates(shot: ShotDTO, count: number): string[] {
    if (!shot.date || !shot.frequencyValue || !shot.frequencyUnit) return [];
    const base = new Date(shot.date);
    if (Number.isNaN(base.getTime())) return [];

    const dates: string[] = [];
    let current = base;
    for (let i = 0; i < count; i++) {
      const next = this.addFrequency(current, shot.frequencyValue, shot.frequencyUnit);
      if (!next) break;
      dates.push(this.toIsoDate(next));
      current = next;
    }
    return dates;
  }

  private addFrequency(base: Date, value: number, unit: string): Date | null {
    if (!Number.isFinite(value) || value <= 0) return null;
    const normalized = this.normalizeFrequencyUnit(unit);
    const next = new Date(base.getTime());

    switch (normalized) {
      case 'DAY':
      case 'DAYS':
      case 'NAP':
        next.setDate(next.getDate() + value);
        return next;
      case 'WEEK':
      case 'WEEKS':
      case 'HET':
        next.setDate(next.getDate() + value * 7);
        return next;
      case 'MONTH':
      case 'MONTHS':
      case 'HONAP':
        next.setMonth(next.getMonth() + value);
        return next;
      case 'YEAR':
      case 'YEARS':
      case 'EV':
        next.setFullYear(next.getFullYear() + value);
        return next;
      default:
        return null;
    }
  }

  private normalizeFrequencyUnit(unit: string): string {
    const upper = (unit || '').toUpperCase();
    const normalized = upper.replace(/[ÁÉÍÓÖŐÚÜŰ]/g, (ch) => {
      switch (ch) {
        case 'Á': return 'A';
        case 'É': return 'E';
        case 'Í': return 'I';
        case 'Ó':
        case 'Ö':
        case 'Ő':
          return 'O';
        case 'Ú':
        case 'Ü':
        case 'Ű':
          return 'U';
        default:
          return ch;
      }
    });
    return normalized.replace(/[^A-Z]/g, '');
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
