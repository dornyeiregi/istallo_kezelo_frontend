import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CrudMenuComponent } from '../../components/crud-menu/crud-menu';
import { FarrierAppService } from '../../services/farrier-app.service';
import { FarrierAppDTO } from '../../models/farrier-app.model';
import { HorseService } from '../../services/horse.service';
import { HorseDTO } from '../../models/horse.model';

@Component({
  selector: 'app-farrier-app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, CrudMenuComponent],
  templateUrl: './farrier-app-profile.html',
  styleUrls: ['./farrier-app-profile.css']
})
export class FarrierAppProfilePage implements OnInit {
  farrierApp?: FarrierAppDTO;
  loading = true;
  error: string | null = null;
  horses: HorseDTO[] = [];
  assignedHorses: HorseDTO[] = [];

  editHorsesMode = false;
  selectedHorseIds: Set<number> = new Set();
  saving = false;
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private farrierAppService: FarrierAppService,
    private horseService: HorseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('farrierAppId'));
    if (!id) {
      this.error = 'Érvénytelen patkolási időpont azonosító.';
      this.loading = false;
      return;
    }

    this.loadFarrierApp(id);
  }

  loadFarrierApp(id: number): void {
    this.loading = true;

    this.farrierAppService.getById(id).subscribe({
      next: (data) => {
        this.farrierApp = data;

        this.horseService.getAll().subscribe({
          next: (horses) => {
            this.horses = horses;
            this.selectedHorseIds = new Set(this.farrierApp!.horseIds || []);
            this.updateAssignedHorses();
            this.loading = false;
          },
          error: () => {
            this.error = 'Nem sikerült betölteni a lovakat.';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.error = 'Nem sikerült betölteni a patkolási időpontot.';
        this.loading = false;
      }
    });
  }

  private updateAssignedHorses() {
    this.assignedHorses = this.horses.filter(
      h => this.selectedHorseIds.has(h.id!)
    );
  }

  goBack(): void {
    this.router.navigate(['/farrier-apps']);
  }

  getHorseNameById(id: number): string {
    const horse = this.horses.find(h => h.id === id);
    return horse ? horse.horseName : 'Ismeretlen ló';
  }

  deleteFarrierApp(): void {
    if (!this.farrierApp?.farrierAppId) return;

    if (!confirm('Biztosan törlöd ezt a patkolási időpontot?')) return;

    this.farrierAppService.delete(this.farrierApp.farrierAppId).subscribe({
      next: () => {
        this.router.navigate(['/farrier-apps']);
      },
      error: () => {
        alert('Nem sikerült törölni az időpontot.');
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
    if (!this.farrierApp?.farrierAppId) return;
    this.saving = true;

    const dto: Partial<FarrierAppDTO> = {
      horseIds: Array.from(this.selectedHorseIds)
    };

    this.farrierAppService.update(this.farrierApp.farrierAppId, dto as FarrierAppDTO).subscribe({
      next: () => {
        this.farrierApp!.horseIds = Array.from(this.selectedHorseIds);
        this.updateAssignedHorses();

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
        label: 'Időpont törlése',
        icon: 'fa-trash',
        onClick: () => this.deleteFarrierApp(),
      }
    ];
  }
}
