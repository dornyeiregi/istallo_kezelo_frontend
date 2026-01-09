import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ShotService } from '../../services/shot.service';
import { ShotDTO } from '../../models/shot.model';
import { CrudMenuComponent } from '../../components/crud-menu/crud-menu';
import { HorseService } from '../../services/horse.service';
import { HorseDTO } from '../../models/horse.model';

@Component({
  selector: 'app-shot-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, CrudMenuComponent],
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

    this.loadShot(id);
  }

  loadShot(id: number): void {
    this.loading = true;

    this.shotService.getById(id).subscribe({
      next: (data) => {
        this.shot = data;

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

  getHorseNameById(id: number): string {
    const horse = this.horses.find(h => h.id === id);
    return horse ? horse.horseName : 'Ismeretlen ló';
  }

  goBack(): void {
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
}
