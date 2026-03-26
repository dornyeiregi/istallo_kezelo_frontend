import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ShotService } from '../../services/shot.service';
import { ShotDTO } from '../../models/shot.model';
import { HorseService } from '../../services/horse.service';
import { HorseDTO } from '../../models/horse.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-shot-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shot-edit.html',
  styleUrls: ['./shot-edit.css']
})
export class ShotEditPage implements OnInit {
  loading = false;
  error: string | null = null;
  success = false;

  shotId: number | null = null;
  horses: HorseDTO[] = [];
  selectedHorseIds: Set<number> = new Set();

  form: ShotDTO = {
    shotId: undefined,
    shotName: '',
    date: '',
    frequencyUnit: '',
    frequencyValue: undefined,
    horseIds: []
  };

  frequencyUnits = ['DAYS', 'WEEKS', 'MONTHS', 'YEARS'];

  frequencyLabels: { [key: string]: string } = {
    DAYS: 'Nap',
    WEEKS: 'Hét',
    MONTHS: 'Hónap',
    YEARS: 'Év'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private shotService: ShotService,
    private horseService: HorseService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('shotId'));
    if (!id) {
      this.error = 'Érvénytelen oltás azonosító.';
      return;
    }

    this.shotId = id;
    this.loading = true;

    const horses$ = this.authService.hasAnyRole(['OWNER', 'ROLE_OWNER'])
      ? this.horseService.getMine()
      : this.horseService.getAll();

    forkJoin({
      shot: this.shotService.getById(id),
      horses: horses$
    }).subscribe({
      next: ({ shot, horses }) => {
        this.form = {
          shotId: shot.shotId,
          shotName: shot.shotName,
          date: shot.date,
          frequencyUnit: shot.frequencyUnit ?? '',
          frequencyValue: shot.frequencyValue ?? undefined,
          horseIds: shot.horseIds ?? []
        };

        this.horses = horses;
        this.selectedHorseIds = new Set(shot.horseIds ?? []);

        this.loading = false;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni az oltást.';
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

    if (!this.form.shotName || !this.form.date || !this.shotId) {
      this.error = 'Az oltás neve és dátuma kötelező.';
      return;
    }

    this.loading = true;

    const dto: ShotDTO = {
      shotId: this.shotId,
      shotName: this.form.shotName,
      date: this.form.date,
      frequencyUnit: this.form.frequencyUnit || null,
      frequencyValue: this.form.frequencyValue || null,
      horseIds: Array.from(this.selectedHorseIds)
    };

    this.shotService.update(this.shotId, dto).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;

        setTimeout(() => {
          this.router.navigate(
            ['/shots', this.shotId],
            { state: { fromEdit: true } }
          );
        }, 800);
      },
      error: () => {
        this.loading = false;
        this.error = 'Nem sikerült frissíteni az oltást.';
      }
    });
  }

  goBack() {
    this.router.navigate(['/shots']);
  }
}
