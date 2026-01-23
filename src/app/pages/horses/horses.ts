import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CrudMenuComponent } from '../../components/crud-menu/crud-menu';
import { HorseDTO } from '../../models/horse.model';
import { HorseService } from '../../services/horse.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-horses',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudMenuComponent],
  templateUrl: './horses.html',
  styleUrls: ['./horses.css']
})
export class HorsesPage implements OnInit {
  horses: HorseDTO[] = [];
  loading = true;
  error = '';
  editMode = false;
  showAll = false;
  deleteMode = false;
  deleteSuccess = '';
  confirmDeleteHorse: HorseDTO | null = null;
  toastMessage: string = '';
  toastVisible: boolean = false;

  constructor(private horseService: HorseService,
              private router: Router,
              private authService: AuthService) {}

  ngOnInit(): void {
    this.loadHorses();
  }

  loadHorses(): void {
    this.loading = true;
    const source$ = this.showAll
      ? this.horseService.getAll()
      : this.horseService.getMine();

    source$.subscribe({
      next: (data) => {
        this.horses = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni a lovakat.';
        this.loading = false;
      }
    });
  }

  get canToggleView(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'ROLE_ADMIN']);
  }

  toggleView(): void {
    this.showAll = !this.showAll;
    this.loadHorses();
  }

  onCardClick(horse: HorseDTO): void {
    if (this.editMode) {
      this.router.navigate(['/horses/edit', horse.id]);
      this.editMode = false;
    } else {
      this.router.navigate(['/horses', horse.horseName], { state: { horse } });
    }
  }

  addHorse(): void {
    this.router.navigate(['/horses/new']);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
  }

  showToast(message: string) {
    this.toastMessage = message;
    this.toastVisible = true;

    setTimeout(() => {
      this.toastVisible = false;
    }, 3000);
  }

  deleteHorse(horse: HorseDTO): void {
    if (!horse.id) return;

    this.horseService.delete(horse.id).subscribe({
      next: () => {
        this.deleteSuccess = 'A(z) ${horse.horseName} sikeresen törölve.';
        this.horses = this.horses.filter(h => h.id !== horse.id);
      },
      error: () => {
        this.error = 'Nem sikerült törölni a lovat.';
      }
    });
  }

  confirmDelete(horse: HorseDTO) {
    this.confirmDeleteHorse = horse;
  }

  performDelete() {
    if (!this.confirmDeleteHorse) return;

    this.horseService.delete(this.confirmDeleteHorse.id!).subscribe({
      next: () => {
        this.showToast(`A(z) ${this.confirmDeleteHorse!.horseName} sikeresen törölve.`);

        this.loadHorses();

        this.confirmDeleteHorse = null;
        this.deleteMode = false;
      },
      error: () => {
        this.showToast('Nem sikerült törölni a lovat.');

        this.confirmDeleteHorse = null;
        this.deleteMode = false;
      }
    });
  }


  cancelDelete() {
    this.confirmDeleteHorse = null;
  }

  get crudActions() {
    return [
      {
        label: 'Új ló hozzáadása',
        icon: 'fa-circle-plus',
        onClick: () => this.addHorse()
      },
      {
        label: 'Szerkesztés',
        icon: 'fa-pen-to-square',
        onClick: () => this.toggleEditMode()
      },
      {
        label: 'Törlés',
        icon: 'fa-trash',
        onClick: () => {
          this.deleteMode = !this.deleteMode;
          this.confirmDeleteHorse = null;
          this.deleteSuccess = '';
        }
      }
    ];
  }

  getSexLabel(sex: string): string {
    switch (sex) {
      case 'M':
        return 'Csődör';
      case 'F':
        return 'Kanca';
      case 'G':
        return 'Herélt';
      default:
        return sex;
    }
  }
}
