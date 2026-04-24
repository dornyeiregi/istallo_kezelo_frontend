import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { FarrierAppService } from '../../services/farrier-app.service';
import { FarrierAppDTO, FarrierHorseDetailDTO } from '../../models/farrier-app.model';
import { HorseService } from '../../services/horse.service';
import { HorseDTO } from '../../models/horse.model';

@Component({
  selector: 'app-farrier-app-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './farrier-app-edit.html',
  styleUrls: ['./farrier-app-edit.css'],
})
export class FarrierAppEditPage implements OnInit {
  loading = false;
  error: string | null = null;
  success = false;

  farrierAppId: number | null = null;
  horses: HorseDTO[] = [];
  selectedHorseIds: Set<number> = new Set();
  horseDetails = new Map<number, FarrierHorseDetailDTO>();

  form: FarrierAppDTO = {
    farrierAppId: undefined,
    farrierName: '',
    farrierPhone: '',
    appointmentDate: '',
    frequencyUnit: '',
    frequencyValue: undefined,
    horseIds: [],
  };

  frequencyUnits = ['DAYS', 'WEEKS', 'MONTHS', 'YEARS'];
  frequencyLabels: { [key: string]: string } = {
    DAYS: 'Nap',
    WEEKS: 'Hét',
    MONTHS: 'Hónap',
    YEARS: 'Év',
  };

  constructor(
    private farrierAppService: FarrierAppService,
    private horseService: HorseService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('farrierAppId'));
    if (!id) {
      this.error = 'Érvénytelen patkolási időpont azonosító.';
      return;
    }

    this.farrierAppId = id;
    this.loading = true;

    forkJoin({
      farrierApp: this.farrierAppService.getById(id),
      horses: this.horseService.getAll(),
    }).subscribe({
      next: ({ farrierApp, horses }) => {
        this.form = {
          farrierAppId: farrierApp.farrierAppId,
          farrierName: farrierApp.farrierName,
          farrierPhone: farrierApp.farrierPhone,
          appointmentDate: farrierApp.appointmentDate,
          frequencyUnit: farrierApp.frequencyUnit ?? '',
          frequencyValue: farrierApp.frequencyValue ?? undefined,
          shoes: farrierApp.shoes ?? null,
          horseIds: farrierApp.horseIds || [],
          horseDetails: farrierApp.horseDetails || [],
        };

        this.horses = horses;
        this.selectedHorseIds = new Set(farrierApp.horseIds || []);
        this.horseDetails.clear();
        (farrierApp.horseDetails || []).forEach((detail) => {
          if (detail.horseId != null) {
            this.horseDetails.set(detail.horseId, {
              horseId: detail.horseId,
              shoeCount: detail.shoeCount ?? 0,
              note: detail.note ?? '',
            });
          }
        });
        this.selectedHorseIds.forEach((horseId) => {
          if (!this.horseDetails.has(horseId)) {
            this.horseDetails.set(horseId, { horseId, shoeCount: 4, note: '' });
          }
        });
        this.loading = false;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni a patkolási időpontot.';
        this.loading = false;
      },
    });
  }

  toNumber(id: any): number {
    return Number(id);
  }

  toggleHorseSelection(horseId: number) {
    horseId = Number(horseId);

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

  getHorseDetail(horseId: number): FarrierHorseDetailDTO {
    if (!this.horseDetails.has(horseId)) {
      this.horseDetails.set(horseId, { horseId, shoeCount: 4, note: '' });
    }
    return this.horseDetails.get(horseId)!;
  }

  onSubmit() {
    this.error = null;

    if (!this.form.farrierName || !this.form.appointmentDate || !this.farrierAppId) {
      this.error = 'A patkolási időpont neve és dátuma kötelező.';
      return;
    }

    this.loading = true;

    const dto: FarrierAppDTO = {
      farrierAppId: this.farrierAppId,
      farrierName: this.form.farrierName,
      farrierPhone: this.form.farrierPhone,
      appointmentDate: this.form.appointmentDate,
      frequencyUnit: this.form.frequencyUnit || null,
      frequencyValue: this.form.frequencyValue || null,
      shoes: null,
      horseIds: Array.from(this.selectedHorseIds),
      horseDetails: Array.from(this.selectedHorseIds).map((horseId) => {
        const detail = this.getHorseDetail(horseId);
        return {
          horseId,
          shoeCount: detail.shoeCount ?? 0,
          note: detail.note ?? '',
        };
      }),
    };

    this.farrierAppService.update(this.farrierAppId, dto).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;

        setTimeout(() => {
          this.router.navigate(['/farrier-apps', this.farrierAppId], { state: { fromEdit: true } });
        }, 800);
      },
      error: () => {
        this.loading = false;
        this.error = 'Nem sikerült frissíteni a patkolási időpontot.';
      },
    });
  }

  goBack() {
    this.router.navigate(['/farrier-apps']);
  }
}
