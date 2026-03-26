import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrudMenuComponent } from '../../components/crud-menu/crud-menu';
import { TreatmentService } from '../../services/treatment.service';
import { TreatmentDTO } from '../../models/treatment.model';
import { HorseService } from '../../services/horse.service';
import { HorseDTO } from '../../models/horse.model';

@Component({
  selector: 'app-treatment-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudMenuComponent],
  templateUrl: './treatment-profile.html',
  styleUrls: ['./treatment-profile.css']
})
export class TreatmentProfilePage implements OnInit {
  treatment?: TreatmentDTO;
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
    private treatmentService: TreatmentService,
    private horseService: HorseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('treatmentId'));
    if (!id) {
      this.error = 'Érvénytelen kezelés azonosító.';
      this.loading = false;
      return;
    }

    const dueDateParam = this.route.snapshot.queryParamMap.get('dueDate');
    this.plannedDueDate = dueDateParam;
    if (this.plannedDueDate) {
      this.completedDate = this.plannedDueDate;
      this.markDueCompleted = false;
    }

    this.loadTreatment(id);
  }

  loadTreatment(id: number): void {
    this.loading = true;

    this.treatmentService.getById(id).subscribe({
      next: (data) => {
        this.treatment = data;
        this.nextPlannedDates = this.buildNextPlannedDates(this.treatment, 3);

        this.horseService.getAll().subscribe({
          next: (horses) => {
            this.horses = horses;
            this.selectedHorseIds = new Set(this.treatment!.horseIds || []);
            this.updateTreatedHorsesFromIds();
            this.loading = false;
          },
          error: () => {
            this.error = 'Nem sikerült betölteni a lovakat.';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.error = 'Nem sikerült betölteni a kezelést.';
        this.loading = false;
      }
    });
  }

  private updateTreatedHorsesFromIds() {
    this.treatedHorses = this.horses.filter(
      h => this.selectedHorseIds.has(h.id!)
    );
  }

  goBack(): void {
    if (history.state?.fromEdit) {
      this.router.navigate(['/treatments']);
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/treatments']);
    }
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

  deleteTreatment(): void {
    if (!this.treatment?.treatmentId) return;

    if (!confirm('Biztosan törlöd ezt a kezelést?')) return;

    this.treatmentService.delete(this.treatment.treatmentId).subscribe({
      next: () => {
        this.router.navigate(['/treatments']);
      },
      error: () => {
        alert('Nem sikerült törölni a kezelést.');
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
    if (!this.treatment?.treatmentId) return;
    this.saving = true;

    const dto: Partial<TreatmentDTO> = {
      treatmentName: this.treatment?.treatmentName ?? '',
      description: this.treatment?.description ?? '',
      date: this.treatment?.date ?? '',
      horseIds: Array.from(this.selectedHorseIds)
    };

    this.treatmentService.update(this.treatment.treatmentId, dto as TreatmentDTO).subscribe({
      next: () => {
        this.treatment!.horseIds = Array.from(this.selectedHorseIds);
        this.updateTreatedHorsesFromIds();

        this.successMessage = 'Lovak sikeresen frissítve.';
        this.saving = false;
        this.editHorsesMode = false;

        setTimeout(() => this.successMessage = '', 2000);
      },
      error: () => {
        this.error = 'Nem sikerült frissíteni a lovakat.';
        this.saving = false;
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
    if (!this.treatment || !this.treatment.frequencyValue || !this.treatment.frequencyUnit) return '-';
    const unitLabel = this.frequencyLabels[this.treatment.frequencyUnit] || this.treatment.frequencyUnit;
    return `${this.treatment.frequencyValue} ${unitLabel}`;
  }

  confirmDueTreatment(): void {
    if (!this.treatment?.treatmentId) return;
    if (!this.markDueCompleted) return;
    if (!this.completedDate) {
      this.error = 'Add meg a kezelés dátumát.';
      return;
    }

    const dto: Partial<TreatmentDTO> = {
      treatmentName: this.treatment?.treatmentName ?? '',
      description: this.treatment?.description ?? '',
      date: this.completedDate,
      frequencyUnit: this.treatment?.frequencyUnit ?? null,
      frequencyValue: this.treatment?.frequencyValue ?? null,
      horseIds: this.treatment?.horseIds ?? []
    };

    this.saving = true;
    this.treatmentService.update(this.treatment.treatmentId, dto as TreatmentDTO).subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = 'A kezelés dátuma frissítve.';
        this.treatment!.date = this.completedDate;
        this.nextPlannedDates = this.buildNextPlannedDates(this.treatment!, 3);
        this.plannedDueDate = null;
        this.markDueCompleted = false;
        setTimeout(() => this.successMessage = '', 2000);
      },
      error: () => {
        this.error = 'Nem sikerült frissíteni a kezelést.';
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
        label: 'Kezelés törlése',
        icon: 'fa-trash',
        onClick: () => this.deleteTreatment(),
      }
    ];
  }

  private buildNextPlannedDates(treatment: TreatmentDTO, count: number): string[] {
    if (!treatment.date || !treatment.frequencyValue || !treatment.frequencyUnit) return [];
    const base = new Date(treatment.date);
    if (Number.isNaN(base.getTime())) return [];

    const dates: string[] = [];
    let current = base;
    for (let i = 0; i < count; i++) {
      const next = this.addFrequency(current, treatment.frequencyValue, treatment.frequencyUnit);
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
