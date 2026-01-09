import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StableService } from '../../services/stable.service';
import { StableDTO } from '../../models/stable.model';
import { CrudMenuComponent } from '../../components/crud-menu/crud-menu';
import { AuthService } from '../../services/auth.service';
import { HorseDTO } from '../../models/horse.model';
import { HorseService } from '../../services/horse.service';

@Component({
  selector: 'app-stable-profile',
  standalone: true,
  imports: [CommonModule, CrudMenuComponent],
  templateUrl: './stable-profile.html',
  styleUrls: ['./stable-profile.css']
})
export class StableProfilePage implements OnInit {
  stable?: StableDTO;
  loading = true;
  error = '';
  readonly averageHayPerHorseKg = 10;
  editMode = false;
  deleteMode = false;

  confirmDeleteHorse: HorseDTO | null = null;
  toastMessage = '';
  toastVisible = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stableService: StableService,
    private horseService: HorseService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const navStable = this.router.getCurrentNavigation()?.extras.state?.['stable'] as StableDTO | undefined;
    if (navStable) {
      this.stable = navStable;
      this.loading = false;
      return;
    }

    const stableName = this.route.snapshot.paramMap.get('stableName');
    if (!stableName) {
      this.error = 'Nincs kiválasztott istálló.';
      this.loading = false;
      return;
    }

    this.fetchStable(stableName);
  }

  get horseCount(): number {
    return this.stable?.horses ? this.stable.horses.length : 0;
  }

  get estimatedDailyHayKg(): number {
    return this.horseCount * this.averageHayPerHorseKg;
  }

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/stables']);
    }
  }

  private fetchStable(stableName: string): void {
    this.stableService.getAll().subscribe({
      next: (stables) => {
        this.stable = stables.find((stable) => stable.stableName === stableName);
        if (!this.stable) {
          this.error = 'Nem található ilyen nevű istálló.';
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni az istálló adatait.';
        this.loading = false;
      }
    });
  }

  onHorseClick(horse: HorseDTO): void {
    if (this.deleteMode) {
      this.confirmDelete(horse);
      return;
    }

    if (this.editMode) {
      this.router.navigate(
        ['/horses/edit', horse.id],
        { state: { returnToStable: this.stable?.stableName } }
      );
    } else {
      this.router.navigate(
        ['/horses', horse.horseName],
        { state: { horse } }
      );
    }
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    this.deleteMode = false;
  }

  toggleDeleteMode(): void {
    this.deleteMode = !this.deleteMode;
    this.editMode = false;
    this.confirmDeleteHorse = null;
  }

  confirmDelete(horse: HorseDTO): void {
    this.confirmDeleteHorse = horse;
  }

  performDelete(): void {
    if (!this.confirmDeleteHorse?.id) return;

    this.horseService.delete(this.confirmDeleteHorse.id).subscribe({
      next: () => {
        this.showToast(`A(z) ${this.confirmDeleteHorse?.horseName} törölve.`);
        this.confirmDeleteHorse = null;

        if (this.stable?.stableName) {
          this.fetchStable(this.stable.stableName);
        }

        this.deleteMode = false;
      },
      error: () => {
        this.showToast('Nem sikerült törölni a lovat.');
        this.confirmDeleteHorse = null;
        this.deleteMode = false;
      }
    });
  }

  cancelDelete(): void {
    this.confirmDeleteHorse = null;
  }

  showToast(message: string): void {
    this.toastMessage = message;
    this.toastVisible = true;

    setTimeout(() => {
      this.toastVisible = false;
    }, 3000);
  }

  get crudActions() {
    return [
      {
        label: "Hozzáadás",
        icon: "fa-plus",
        onClick: () => {
          this.router.navigate(
            ['/horses/new'],
            { 
              state: { 
                preselectStableId: this.stable?.stableId,
                preselectStableName: this.stable?.stableName
              }
            }
          );
        }
      },
      {
        label: "Szerkesztés",
        icon: "fa-pen-to-square",
        onClick: () => this.toggleEditMode()
      },
      {
        label: "Törlés",
        icon: "fa-trash",
        onClick: () => this.toggleDeleteMode()
      }
    ];
  }

  getSexLabel(sex: string | undefined): string {
    switch (sex) {
      case 'M':
        return 'Csődör';
      case 'F':
        return 'Kanca';
      case 'G':
        return 'Herélt';
      default:
        return sex ?? '';
    }
  }

}
