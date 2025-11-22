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
              h => this.shot!.horseIds?.includes(h.horseId!)
            );

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

  goBack(): void {
    this.router.navigate(['/shots']);
  }

  goToHorseProfile(horseName: string) {
    this.router.navigate(['/horses', horseName]);
  }


  editShot(): void {
    if (!this.shot?.shotId) return;
    this.router.navigate(['/shots/edit', this.shot.shotId]);
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

  get crudActions() {
    return [
      {
        label: 'Oltás szerkesztése',
        icon: 'edit',
        onClick: () => this.editShot(),
      },
      {
        label: 'Oltás törlése',
        icon: 'delete',
        onClick: () => this.deleteShot(),
      }
    ];
  }
}
