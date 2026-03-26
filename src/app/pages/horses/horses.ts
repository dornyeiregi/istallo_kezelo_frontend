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
  showInactive = false;
  showPending = false;
  deleteMode = false;
  deleteSuccess = '';
  confirmDeleteHorse: HorseDTO | null = null;
  toastMessage: string = '';
  toastVisible: boolean = false;
  pendingRequests: HorseDTO[] = [];
  pendingCount = 0;

  constructor(private horseService: HorseService,
              private router: Router,
              private authService: AuthService) {}

  ngOnInit(): void {
    if (this.isEmployee) {
      this.showAll = true;
    }

    if (this.canToggleView) {
      this.showAll = true;
    }
    this.loadHorses();

    if (this.canToggleView) {
      this.refreshPendingCount();
    }

    if (history.state && history.state['requestSent']) {
      this.showToast('Kérés elküldve, jóváhagyás után jelenik meg.');
    }
  }

  loadHorses(): void {
    this.loading = true;
    if (this.showInactive && !this.canToggleView) {
      this.showInactive = false;
    }
    if (this.showPending && !this.canViewPending) {
      this.showPending = false;
    }

    let source$;
    if (this.showInactive) {
      source$ = this.horseService.getInactive();
    } else if (this.showPending) {
      source$ = this.canToggleView ? this.horseService.getRequests() : this.horseService.getMyRequests();
    } else {
      source$ = (this.isEmployee || this.showAll ? this.horseService.getAll() : this.horseService.getMine());
    }

    source$.subscribe({
      next: (data) => {
        this.horses = data;
        if (!this.showInactive && !this.showPending) {
          this.loadPendingForOwner();
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni a lovakat.';
        this.loading = false;
      }
    });
  }

  private loadPendingForOwner(): void {
    if (!this.authService.hasAnyRole(['OWNER', 'ROLE_OWNER'])) return;
    this.horseService.getMyRequests().subscribe({
      next: (requests) => {
        const existingIds = new Set(this.horses.map(h => h.id));
        const merged = [...this.horses];
        for (const req of requests) {
          if (req.id && !existingIds.has(req.id)) {
            merged.push(req);
          }
        }
        this.horses = merged;
      }
    });
  }

  private refreshPendingCount(): void {
    this.horseService.getRequests().subscribe({
      next: (requests) => {
        this.pendingRequests = requests;
        this.pendingCount = requests.length;
      }
    });
  }

  get canToggleView(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'ROLE_ADMIN']);
  }

  get canDelete(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'ROLE_ADMIN']);
  }

  get isEmployee(): boolean {
    return this.authService.hasAnyRole(['EMPLOYEE', 'ROLE_EMPLOYEE']);
  }

  get canViewPending(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'ROLE_ADMIN', 'OWNER', 'ROLE_OWNER']);
  }

  toggleView(): void {
    this.showAll = !this.showAll;
    if (this.showInactive) {
      this.showInactive = false;
    }
    if (this.showPending) {
      this.showPending = false;
    }
    this.loadHorses();
  }

  toggleInactive(): void {
    this.showInactive = !this.showInactive;
    if (this.showInactive) {
      this.showPending = false;
    }
    this.loadHorses();
  }

  togglePending(): void {
    this.showPending = !this.showPending;
    if (this.showPending) {
      this.showInactive = false;
    }
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

  performDelete(mode: 'delete' | 'deactivate') {
    if (!this.confirmDeleteHorse) return;

    const action$ = mode === 'deactivate'
      ? this.horseService.deactivate(this.confirmDeleteHorse.id!)
      : this.horseService.delete(this.confirmDeleteHorse.id!);

    action$.subscribe({
      next: () => {
        const message = mode === 'deactivate'
          ? `A(z) ${this.confirmDeleteHorse!.horseName} eltávolítva az istállóból.`
          : `A(z) ${this.confirmDeleteHorse!.horseName} sikeresen törölve.`;
        this.showToast(message);

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

  activateHorse(horse: HorseDTO): void {
    if (!horse.id) return;
    this.horseService.activate(horse.id).subscribe({
      next: () => {
        this.showToast(`A(z) ${horse.horseName} aktiválva.`);
        this.loadHorses();
      },
      error: () => {
        this.showToast('Nem sikerült aktiválni a lovat.');
      }
    });
  }


  cancelDelete() {
    this.confirmDeleteHorse = null;
  }

  get crudActions() {
    const actions = [
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

    if (!this.canDelete) {
      return actions.filter(action => action.label !== 'Törlés');
    }

    return actions;
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
