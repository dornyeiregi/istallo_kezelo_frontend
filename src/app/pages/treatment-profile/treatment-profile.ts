import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CrudMenuComponent } from '../../components/crud-menu/crud-menu';
import { TreatmentService } from '../../services/treatment.service';
import { TreatmentDTO } from '../../models/treatment.model';
import { HorseService } from '../../services/horse.service';
import { HorseDTO } from '../../models/horse.model';

@Component({
  selector: 'app-treatment-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, CrudMenuComponent],
  templateUrl: './treatment-profile.html',
  styleUrls: ['./treatment-profile.css']
})
export class TreatmentProfilePage implements OnInit {
  treatment?: TreatmentDTO;
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
    private treatmentService: TreatmentService,
    private horseService: HorseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('treatmentId'));
    if (!id) {
      this.error = 'Érvénytelen kezelés azonosító.';
      this.loading = false;
      return;
    }

    this.loadTreatment(id);
  }

  loadTreatment(id: number): void {
    this.loading = true;

    this.treatmentService.getById(id).subscribe({
      next: (data) => {
        this.treatment = data;

        this.horseService.getAll().subscribe({
          next: (horses) => {
            this.horses = horses;
            this.selectedHorseIds = new Set(this.treatment!.horseIds || []);
            this.updateTreatedHorsesFromIds();
            this.loading = false;
          },
          error: () => {
            this.error = 'Nem sikerült betölteni a lovakat.';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.error = 'Nem sikerült betölteni a kezelést.';
        this.loading = false;
      }
    });
  }

  private updateTreatedHorsesFromIds() {
    this.treatedHorses = this.horses.filter(
      h => this.selectedHorseIds.has(h.id!)
    );
  }

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/treatments']);
    }
  }

  getHorseNameById(id: number): string {
    const horse = this.horses.find(h => h.id === id);
    return horse ? horse.horseName : 'Ismeretlen ló';
  }

  deleteTreatment(): void {
    if (!this.treatment?.treatmentId) return;

    if (!confirm('Biztosan törlöd ezt a kezelést?')) return;

    this.treatmentService.delete(this.treatment.treatmentId).subscribe({
      next: () => {
        this.router.navigate(['/treatments']);
      },
      error: () => {
        alert('Nem sikerült törölni a kezelést.');
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
    if (!this.treatment?.treatmentId) return;
    this.saving = true;

    const dto: Partial<TreatmentDTO> = {
      treatmentName: this.treatment?.treatmentName ?? '',
      description: this.treatment?.description ?? '',
      date: this.treatment?.date ?? '',
      horseIds: Array.from(this.selectedHorseIds)
    };

    this.treatmentService.update(this.treatment.treatmentId, dto as TreatmentDTO).subscribe({
      next: () => {
        this.treatment!.horseIds = Array.from(this.selectedHorseIds);
        this.updateTreatedHorsesFromIds();

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
        label: 'Kezelés törlése',
        icon: 'fa-trash',
        onClick: () => this.deleteTreatment(),
      }
    ];
  }
}
