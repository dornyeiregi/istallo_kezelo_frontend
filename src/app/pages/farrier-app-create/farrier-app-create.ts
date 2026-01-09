import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FarrierAppService } from '../../services/farrier-app.service';
import { FarrierAppDTO } from '../../models/farrier-app.model';
import { HorseService } from '../../services/horse.service';
import { HorseDTO } from '../../models/horse.model';

@Component({
  selector: 'app-farrier-app-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './farrier-app-create.html',
  styleUrls: ['./farrier-app-create.css']
})
export class FarrierAppCreatePage implements OnInit {
  loading = false;
  error: string | null = null;
  success = false;
  horses: HorseDTO[] = [];
  selectedHorseIds: Set<number> = new Set();

  form: FarrierAppDTO = {
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

    if (!this.form.farrierName || !this.form.appointmentDate) {
      this.error = 'A patkolási időpont neve és dátuma kötelező.';
      return;
    }

    this.loading = true;

    const dto: FarrierAppDTO = {
      farrierName: this.form.farrierName,
      farrierPhone: this.form.farrierPhone,
      appointmentDate: this.form.appointmentDate,
      shoes: !!this.form.shoes,
      horseIds: Array.from(this.selectedHorseIds)
    };

    this.farrierAppService.create(dto).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;

        setTimeout(() => {
          this.router.navigate(['/farrier-apps']);
        }, 1000);
      },
      error: () => {
        this.loading = false;
        this.error = 'Nem sikerült létrehozni a patkolási időpontot.';
      }
    });
  }

  goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/farrier-apps']);
    }
  }
}
