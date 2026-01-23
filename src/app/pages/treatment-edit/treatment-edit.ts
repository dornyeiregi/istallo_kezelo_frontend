import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TreatmentService } from '../../services/treatment.service';
import { TreatmentDTO } from '../../models/treatment.model';
import { HorseService } from '../../services/horse.service';
import { HorseDTO } from '../../models/horse.model';

@Component({
  selector: 'app-treatment-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './treatment-edit.html',
  styleUrls: ['./treatment-edit.css']
})
export class TreatmentEditPage implements OnInit {
  loading = false;
  error: string | null = null;
  success = false;

  treatmentId: number | null = null;
  horses: HorseDTO[] = [];
  selectedHorseIds: Set<number> = new Set();

  form: TreatmentDTO = {
    treatmentId: undefined,
    treatmentName: '',
    description: '',
    date: '',
    horseIds: []
  };

  constructor(
    private treatmentService: TreatmentService,
    private horseService: HorseService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('treatmentId'));
    if (!id) {
      this.error = 'Érvénytelen kezelés azonosító.';
      return;
    }

    this.treatmentId = id;
    this.loading = true;

    forkJoin({
      treatment: this.treatmentService.getById(id),
      horses: this.horseService.getAll()
    }).subscribe({
      next: ({ treatment, horses }) => {
        this.form = {
          treatmentId: treatment.treatmentId,
          treatmentName: treatment.treatmentName,
          description: treatment.description || '',
          date: treatment.date,
          horseIds: treatment.horseIds || []
        };

        this.horses = horses;
        this.selectedHorseIds = new Set(treatment.horseIds || []);
        this.loading = false;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni a kezelést.';
        this.loading = false;
      }
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

    if (!this.form.treatmentName || !this.form.date || !this.treatmentId) {
      this.error = 'A kezelés neve és dátuma kötelező.';
      return;
    }

    this.loading = true;

    const dto: TreatmentDTO = {
      treatmentId: this.treatmentId,
      treatmentName: this.form.treatmentName,
      description: this.form.description || '',
      date: this.form.date,
      horseIds: Array.from(this.selectedHorseIds)
    };

    this.treatmentService.update(this.treatmentId, dto).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;

        setTimeout(() => {
          this.router.navigate(
            ['/treatments', this.treatmentId],
            { state: { fromEdit: true } }
          );
        }, 800);
      },
      error: () => {
        this.loading = false;
        this.error = 'Nem sikerült frissíteni a kezelést.';
      }
    });
  }

  goBack() {
    this.router.navigate(['/treatments']);
  }
}
