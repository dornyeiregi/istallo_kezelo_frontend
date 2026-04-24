import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ShotService } from '../../services/shot.service';
import { ShotDTO } from '../../models/shot.model';
import { HorseService } from '../../services/horse.service';
import { HorseDTO } from '../../models/horse.model';

@Component({
  selector: 'app-shot-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shot-create.html',
  styleUrls: ['./shot-create.css'],
})
export class ShotCreatePage implements OnInit {
  loading = false;
  error: string | null = null;
  success = false;
  horses: HorseDTO[] = [];
  selectedHorseIds: Set<number> = new Set();

  form: ShotDTO = {
    shotId: undefined,
    shotName: '',
    date: '',
    frequencyUnit: '',
    frequencyValue: undefined,
    horseIds: [],
  };

  frequencyUnits = ['DAYS', 'WEEKS', 'MONTHS', 'YEARS'];

  constructor(
    private shotService: ShotService,
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

    if (!this.form.shotName || !this.form.date) {
      this.error = 'Az oltás neve és dátuma kötelező.';
      return;
    }

    this.loading = true;

    const dto: ShotDTO = {
      shotName: this.form.shotName,
      date: this.form.date,
      frequencyUnit: this.form.frequencyUnit || null,
      frequencyValue: this.form.frequencyValue || null,
      horseIds: Array.from(this.selectedHorseIds),
    };

    this.shotService.create(dto).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;

        setTimeout(() => {
          this.router.navigate(['/shots']);
        }, 1000);
      },
      error: () => {
        this.loading = false;
        this.error = 'Nem sikerült létrehozni az oltást.';
      },
    });
  }

  goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/shots']);
    }
  }

  frequencyLabels: { [key: string]: string } = {
    DAYS: 'Nap',
    WEEKS: 'Hét',
    MONTHS: 'Hónap',
    YEARS: 'Év',
  };
}
