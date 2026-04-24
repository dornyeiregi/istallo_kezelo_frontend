import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TreatmentService } from '../../services/treatment.service';
import { TreatmentDTO } from '../../models/treatment.model';
import { HorseService } from '../../services/horse.service';
import { HorseDTO } from '../../models/horse.model';

@Component({
  selector: 'app-treatment-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './treatment-create.html',
  styleUrls: ['./treatment-create.css'],
})
export class TreatmentCreatePage implements OnInit {
  loading = false;
  error: string | null = null;
  success = false;
  horses: HorseDTO[] = [];
  selectedHorseIds: Set<number> = new Set();

  form: TreatmentDTO = {
    treatmentName: '',
    description: '',
    frequencyUnit: '',
    frequencyValue: undefined,
    date: '',
  };

  frequencyUnits = ['DAYS', 'WEEKS', 'MONTHS', 'YEARS'];
  frequencyLabels: { [key: string]: string } = {
    DAYS: 'Nap',
    WEEKS: 'Hét',
    MONTHS: 'Hónap',
    YEARS: 'Év',
  };

  constructor(
    private treatmentService: TreatmentService,
    private horseService: HorseService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const horseIdParam = this.route.snapshot.paramMap.get('horseId');
    if (horseIdParam) {
      const id = Number(horseIdParam);
      if (!Number.isNaN(id)) {
        this.selectedHorseIds.add(id);
      }
    }

    this.loadHorses();
  }

  loadHorses() {
    this.horseService.getAll().subscribe({
      next: (horses) => {
        this.horses = horses;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni a lovakat.';
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
    } else {
      this.selectedHorseIds.add(horseId);
    }
  }

  onSubmit() {
    this.error = null;

    if (!this.form.treatmentName || !this.form.date) {
      this.error = 'A kezelés neve és dátuma kötelező.';
      return;
    }

    this.loading = true;

    const dto: TreatmentDTO = {
      treatmentName: this.form.treatmentName,
      description: this.form.description || '',
      frequencyUnit: this.form.frequencyUnit || null,
      frequencyValue: this.form.frequencyValue || null,
      date: this.form.date,
      horseIds: Array.from(this.selectedHorseIds),
    };

    this.treatmentService.create(dto).subscribe({
      next: () => {
        this.finishSuccess();
      },
      error: () => {
        this.loading = false;
        this.error = 'Nem sikerült létrehozni a kezelést.';
      },
    });
  }

  private finishSuccess() {
    this.loading = false;
    this.success = true;

    setTimeout(() => {
      this.router.navigate(['/treatments']);
    }, 1000);
  }

  goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/treatments']);
    }
  }
}
