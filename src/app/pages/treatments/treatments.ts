import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CrudMenuComponent } from '../../components/crud-menu/crud-menu';
import { TreatmentDTO } from '../../models/treatment.model';
import { TreatmentService } from '../../services/treatment.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-treatments',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudMenuComponent],
  templateUrl: './treatments.html',
  styleUrls: ['./treatments.css']
})
export class TreatmentsPage implements OnInit {
  treatments: TreatmentDTO[] = [];
  loading = true;
  error = '';
  editMode = false;
  deleteMode = false;
  confirmDeleteTreatment: TreatmentDTO | null = null;
  deleteSuccess = '';
  toastMessage: string = '';
  toastVisible: boolean = false;

  constructor(
    private treatmentService: TreatmentService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadTreatments();
  }

  loadTreatments(): void {
    this.loading = true;

    this.treatmentService.getAll().subscribe({
      next: (data) => {
        this.treatments = data.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        this.loading = false;
        this.error = '';
      },
      error: () => {
        this.error = 'Nem sikerült betölteni a kezeléseket.';
        this.loading = false;
      }
    });
  }

  addTreatment(): void {
    this.router.navigate(['/treatments/new']);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.deleteMode = false;
      this.confirmDeleteTreatment = null;
      this.toastVisible = false;
    }
  }

  onCardClick(treatment: TreatmentDTO): void {
    // Törlés mód
    if (this.deleteMode) {
      this.confirmDelete(treatment);
      return;
    }

    if (this.editMode) {
      if (treatment.treatmentId != null) {
        this.router.navigate(['/treatments/edit', treatment.treatmentId]);
      }
      this.editMode = false;
      return;
    }

    // Normál kattintás
    if (treatment.treatmentId != null) {
      this.router.navigate(['/treatments', treatment.treatmentId]);
    }
  }

  confirmDelete(treatment: TreatmentDTO) {
    this.confirmDeleteTreatment = treatment;
  }

  performDelete() {
    if (!this.confirmDeleteTreatment || this.confirmDeleteTreatment.treatmentId == null) return;

    this.treatmentService.delete(this.confirmDeleteTreatment.treatmentId).subscribe({
      next: () => {
        this.showToast(`A(z) ${this.confirmDeleteTreatment!.treatmentName} kezelés sikeresen törölve.`);
        this.treatments = this.treatments.filter(
          t => t.treatmentId !== this.confirmDeleteTreatment!.treatmentId
        );
        this.confirmDeleteTreatment = null;
        this.deleteMode = false;
      },
      error: () => {
        this.showToast('Nem sikerült törölni a kezelést.');
        this.confirmDeleteTreatment = null;
        this.deleteMode = false;
      }
    });
  }

  cancelDelete() {
    this.confirmDeleteTreatment = null;
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
      'ROLE_OWNER'
    ]);

    if (!isAdminOrOwner) {
      return [];
    }

    return [
      {
        label: 'Új kezelés hozzáadása',
        icon: 'fa-circle-plus',
        onClick: () => {
          this.editMode = false;
          this.deleteMode = false;
          this.confirmDeleteTreatment = null;
          this.addTreatment();
        }
      },
      {
        label: 'Szerkesztés',
        icon: 'fa-pen-to-square',
        onClick: () => this.toggleEditMode()
      },
      {
        label: 'Törlés mód',
        icon: 'fa-trash',
        onClick: () => {
          this.deleteMode = !this.deleteMode;
          this.editMode = false;
          this.confirmDeleteTreatment = null;
          this.toastVisible = false;
        }
      }
    ];
  }
}
