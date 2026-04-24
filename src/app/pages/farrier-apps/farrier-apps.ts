import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CrudMenuComponent } from '../../components/crud-menu/crud-menu';
import { FarrierAppService } from '../../services/farrier-app.service';
import { FarrierAppDTO } from '../../models/farrier-app.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-farrier-apps',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudMenuComponent],
  templateUrl: './farrier-apps.html',
  styleUrls: ['./farrier-apps.css'],
})
export class FarrierAppsPage implements OnInit {
  farrierApps: FarrierAppDTO[] = [];
  loading = true;
  error = '';
  editMode = false;
  deleteMode = false;
  confirmDelete: FarrierAppDTO | null = null;
  toastMessage = '';
  toastVisible = false;

  constructor(
    private farrierAppService: FarrierAppService,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadFarrierApps();
  }

  loadFarrierApps(): void {
    this.loading = true;

    this.farrierAppService.getAll().subscribe({
      next: (data) => {
        this.farrierApps = data.sort(
          (a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime(),
        );
        this.loading = false;
        this.error = '';
      },
      error: () => {
        this.error = 'Nem sikerült betölteni a patkolási időpontokat.';
        this.loading = false;
      },
    });
  }

  addFarrierApp(): void {
    this.router.navigate(['/farrier-apps/new']);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.deleteMode = false;
      this.confirmDelete = null;
      this.toastVisible = false;
    }
  }

  onCardClick(app: FarrierAppDTO): void {
    if (this.deleteMode) {
      this.confirmDelete = app;
      return;
    }

    if (this.editMode) {
      if (app.farrierAppId != null) {
        this.router.navigate(['/farrier-apps/edit', app.farrierAppId]);
      }
      this.editMode = false;
      return;
    }

    if (app.farrierAppId != null) {
      this.router.navigate(['/farrier-apps', app.farrierAppId]);
    }
  }

  performDelete() {
    if (!this.confirmDelete?.farrierAppId) return;

    this.farrierAppService.delete(this.confirmDelete.farrierAppId).subscribe({
      next: () => {
        this.showToast(`A(z) ${this.confirmDelete!.farrierName} időpont törölve.`);
        this.farrierApps = this.farrierApps.filter(
          (a) => a.farrierAppId !== this.confirmDelete!.farrierAppId,
        );
        this.confirmDelete = null;
        this.deleteMode = false;
      },
      error: () => {
        this.showToast('Nem sikerült törölni az időpontot.');
        this.confirmDelete = null;
        this.deleteMode = false;
      },
    });
  }

  cancelDelete() {
    this.confirmDelete = null;
  }

  showToast(message: string) {
    this.toastMessage = message;
    this.toastVisible = true;

    setTimeout(() => {
      this.toastVisible = false;
    }, 3000);
  }

  get crudActions() {
    const isAdminOrOwner = this.authService.hasAnyRole([
      'ADMIN',
      'OWNER',
      'ROLE_ADMIN',
      'ROLE_OWNER',
    ]);

    if (!isAdminOrOwner) {
      return [];
    }

    return [
      {
        label: 'Új patkolási időpont',
        icon: 'fa-circle-plus',
        onClick: () => {
          this.editMode = false;
          this.deleteMode = false;
          this.confirmDelete = null;
          this.addFarrierApp();
        },
      },
      {
        label: 'Szerkesztés',
        icon: 'fa-pen-to-square',
        onClick: () => this.toggleEditMode(),
      },
      {
        label: 'Törlés mód',
        icon: 'fa-trash',
        onClick: () => {
          this.deleteMode = !this.deleteMode;
          this.editMode = false;
          this.confirmDelete = null;
          this.toastVisible = false;
        },
      },
    ];
  }
}
