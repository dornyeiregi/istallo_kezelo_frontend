import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrudMenuComponent } from '../../components/crud-menu/crud-menu';
import { FarrierAppService } from '../../services/farrier-app.service';
import { FarrierAppDTO, FarrierHorseDetailDTO } from '../../models/farrier-app.model';
import { HorseService } from '../../services/horse.service';
import { HorseDTO } from '../../models/horse.model';

@Component({
  selector: 'app-farrier-app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudMenuComponent],
  templateUrl: './farrier-app-profile.html',
  styleUrls: ['./farrier-app-profile.css']
})
export class FarrierAppProfilePage implements OnInit {
  farrierApp?: FarrierAppDTO;
  loading = true;
  error: string | null = null;
  horses: HorseDTO[] = [];
  assignedHorses: HorseDTO[] = [];
  horseDetails = new Map<number, FarrierHorseDetailDTO>();

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
    private farrierAppService: FarrierAppService,
    private horseService: HorseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('farrierAppId'));
    if (!id) {
      this.error = 'Érvénytelen patkolási időpont azonosító.';
      this.loading = false;
      return;
    }

    const dueDateParam = this.route.snapshot.queryParamMap.get('dueDate');
    this.plannedDueDate = dueDateParam;
    if (this.plannedDueDate) {
      this.completedDate = this.plannedDueDate;
      this.markDueCompleted = false;
    }

    this.loadFarrierApp(id);
  }

  loadFarrierApp(id: number): void {
    this.loading = true;

    this.farrierAppService.getById(id).subscribe({
      next: (data) => {
        this.farrierApp = data;
        this.nextPlannedDates = this.buildNextPlannedDates(this.farrierApp, 3);
        this.horseDetails.clear();
        (this.farrierApp.horseDetails || []).forEach((detail) => {
          if (detail.horseId != null) {
            this.horseDetails.set(detail.horseId, {
              horseId: detail.horseId,
              horseName: detail.horseName,
              shoeCount: detail.shoeCount ?? 0,
              note: detail.note ?? ''
            });
          }
        });

        this.horseService.getAll().subscribe({
          next: (horses) => {
            this.horses = horses;
            this.selectedHorseIds = new Set(this.farrierApp!.horseIds || []);
            this.selectedHorseIds.forEach((horseId) => {
              if (!this.horseDetails.has(horseId)) {
                this.horseDetails.set(horseId, { horseId, shoeCount: 4, note: '' });
              }
            });
            this.updateAssignedHorses();
            this.loading = false;
          },
          error: () => {
            this.error = 'Nem sikerült betölteni a lovakat.';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.error = 'Nem sikerült betölteni a patkolási időpontot.';
        this.loading = false;
      }
    });
  }

  private updateAssignedHorses() {
    this.assignedHorses = this.horses.filter(
      h => this.selectedHorseIds.has(h.id!)
    );
  }

  goBack(): void {
    if (history.state?.fromEdit) {
      this.router.navigate(['/farrier-apps']);
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/farrier-apps']);
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

  deleteFarrierApp(): void {
    if (!this.farrierApp?.farrierAppId) return;

    if (!confirm('Biztosan törlöd ezt a patkolási időpontot?')) return;

    this.farrierAppService.delete(this.farrierApp.farrierAppId).subscribe({
      next: () => {
        this.router.navigate(['/farrier-apps']);
      },
      error: () => {
        alert('Nem sikerült törölni az időpontot.');
      }
    });
  }

  toggleHorseAssignment(horseId: number) {
    if (this.selectedHorseIds.has(horseId)) {
      this.selectedHorseIds.delete(horseId);
      this.horseDetails.delete(horseId);
    } else {
      this.selectedHorseIds.add(horseId);
      if (!this.horseDetails.has(horseId)) {
        this.horseDetails.set(horseId, { horseId, shoeCount: 4, note: '' });
      }
    }
  }

  saveHorseAssignments() {
    if (!this.farrierApp?.farrierAppId) return;
    this.saving = true;

    const dto: Partial<FarrierAppDTO> = {
      farrierName: this.farrierApp?.farrierName ?? '',
      farrierPhone: this.farrierApp?.farrierPhone ?? '',
      appointmentDate: this.farrierApp?.appointmentDate ?? '',
      shoes: null,
      horseIds: Array.from(this.selectedHorseIds),
      horseDetails: Array.from(this.selectedHorseIds).map((horseId) => {
        const detail = this.getHorseDetail(horseId);
        return {
          horseId,
          shoeCount: detail.shoeCount ?? 0,
          note: detail.note ?? ''
        };
      })
    };

    this.farrierAppService.update(this.farrierApp.farrierAppId, dto as FarrierAppDTO).subscribe({
      next: () => {
        this.farrierApp!.horseIds = Array.from(this.selectedHorseIds);
        this.farrierApp!.horseDetails = dto.horseDetails || [];
        this.horseDetails.clear();
        (this.farrierApp!.horseDetails || []).forEach((detail) => {
          if (detail.horseId != null) {
            this.horseDetails.set(detail.horseId, {
              horseId: detail.horseId,
              horseName: detail.horseName,
              shoeCount: detail.shoeCount ?? 0,
              note: detail.note ?? ''
            });
          }
        });
        this.updateAssignedHorses();

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
    if (!this.farrierApp || !this.farrierApp.frequencyValue || !this.farrierApp.frequencyUnit) return '-';
    const unitLabel = this.frequencyLabels[this.farrierApp.frequencyUnit] || this.farrierApp.frequencyUnit;
    return `${this.farrierApp.frequencyValue} ${unitLabel}`;
  }

  confirmDueFarrier(): void {
    if (!this.farrierApp?.farrierAppId) return;
    if (!this.markDueCompleted) return;
    if (!this.completedDate) {
      this.error = 'Add meg a patkolás dátumát.';
      return;
    }

    const dto: Partial<FarrierAppDTO> = {
      farrierName: this.farrierApp?.farrierName ?? '',
      farrierPhone: this.farrierApp?.farrierPhone ?? '',
      appointmentDate: this.completedDate,
      frequencyUnit: this.farrierApp?.frequencyUnit ?? null,
      frequencyValue: this.farrierApp?.frequencyValue ?? null,
      shoes: null,
      horseIds: this.farrierApp?.horseIds ?? [],
      horseDetails: this.farrierApp?.horseDetails ?? []
    };

    this.saving = true;
    this.farrierAppService.update(this.farrierApp.farrierAppId, dto as FarrierAppDTO).subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = 'A patkolás dátuma frissítve.';
        this.farrierApp!.appointmentDate = this.completedDate;
        this.nextPlannedDates = this.buildNextPlannedDates(this.farrierApp!, 3);
        this.plannedDueDate = null;
        this.markDueCompleted = false;
        setTimeout(() => this.successMessage = '', 2000);
      },
      error: () => {
        this.error = 'Nem sikerült frissíteni a patkolást.';
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
        label: 'Időpont törlése',
        icon: 'fa-trash',
        onClick: () => this.deleteFarrierApp(),
      }
    ];
  }

  getHorseDetail(horseId: number): FarrierHorseDetailDTO {
    if (!this.horseDetails.has(horseId)) {
      this.horseDetails.set(horseId, { horseId, shoeCount: 4, note: '' });
    }
    return this.horseDetails.get(horseId)!;
  }

  getHorseShoeLabel(horseId: number): string {
    const count = this.getHorseDetail(horseId).shoeCount ?? 0;
    if (count === 4) return '4 patkó';
    if (count === 2) return '2 patkó';
    return 'Nincs patkó';
  }

  private buildNextPlannedDates(farrierApp: FarrierAppDTO, count: number): string[] {
    if (!farrierApp.appointmentDate || !farrierApp.frequencyValue || !farrierApp.frequencyUnit) return [];
    const base = new Date(farrierApp.appointmentDate);
    if (Number.isNaN(base.getTime())) return [];

    const dates: string[] = [];
    let current = base;
    for (let i = 0; i < count; i++) {
      const next = this.addFrequency(current, farrierApp.frequencyValue, farrierApp.frequencyUnit);
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
