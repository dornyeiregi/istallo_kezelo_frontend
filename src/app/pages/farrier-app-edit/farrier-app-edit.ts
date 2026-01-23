import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { FarrierAppService } from '../../services/farrier-app.service';
import { FarrierAppDTO } from '../../models/farrier-app.model';
import { HorseService } from '../../services/horse.service';
import { HorseDTO } from '../../models/horse.model';

@Component({
  selector: 'app-farrier-app-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './farrier-app-edit.html',
  styleUrls: ['./farrier-app-edit.css']
})
export class FarrierAppEditPage implements OnInit {
  loading = false;
  error: string | null = null;
  success = false;

  farrierAppId: number | null = null;
  horses: HorseDTO[] = [];
  selectedHorseIds: Set<number> = new Set();

  form: FarrierAppDTO = {
    farrierAppId: undefined,
    farrierName: '',
    farrierPhone: '',
    appointmentDate: '',
    shoes: false,
    horseIds: []
  };

  constructor(
    private farrierAppService: FarrierAppService,
    private horseService: HorseService,
    private router: Router,
    private route: ActivatedRoute
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
      horses: this.horseService.getAll()
    }).subscribe({
      next: ({ farrierApp, horses }) => {
        this.form = {
          farrierAppId: farrierApp.farrierAppId,
          farrierName: farrierApp.farrierName,
          farrierPhone: farrierApp.farrierPhone,
          appointmentDate: farrierApp.appointmentDate,
          shoes: !!farrierApp.shoes,
          horseIds: farrierApp.horseIds || []
        };

        this.horses = horses;
        this.selectedHorseIds = new Set(farrierApp.horseIds || []);
        this.loading = false;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni a patkolási időpontot.';
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
      shoes: !!this.form.shoes,
      horseIds: Array.from(this.selectedHorseIds)
    };

    this.farrierAppService.update(this.farrierAppId, dto).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;

        setTimeout(() => {
          this.router.navigate(
            ['/farrier-apps', this.farrierAppId],
            { state: { fromEdit: true } }
          );
        }, 800);
      },
      error: () => {
        this.loading = false;
        this.error = 'Nem sikerült frissíteni a patkolási időpontot.';
      }
    });
  }

  goBack() {
    this.router.navigate(['/farrier-apps']);
  }
}
