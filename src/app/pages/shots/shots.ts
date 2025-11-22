import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ShotDTO } from '../../models/shot.model';
import { ShotService } from '../../services/shot.service';
import { CrudMenuComponent } from '../../components/crud-menu/crud-menu';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-shots',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudMenuComponent],
  templateUrl: './shots.html',
  styleUrls: ['./shots.css']
})
export class ShotsPage implements OnInit {
  shots: ShotDTO[] = [];
  loading = true;
  error = '';
  editMode = false;
  deleteMode = false;
  confirmDeleteShot: ShotDTO | null = null;
  deleteSuccess = '';
  toastMessage: string = '';
  toastVisible: boolean = false;

  constructor(
    private shotService: ShotService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadShots();
  }

  loadShots(): void {
    this.loading = true;

    this.shotService.getAll().subscribe({
      next: (data) => {
        this.shots = data.sort((a, b) =>
          new Date(b.date!).getTime() - new Date(a.date!).getTime()
        );

        this.loading = false;
        this.error = '';
      },
      error: () => {
        this.error = 'Nem sikerült betölteni az oltásokat.';
        this.loading = false;
      }
    });
  }

  addShot(): void {
    this.router.navigate(['/shots/new']);
  }


  onCardClick(shot: ShotDTO): void {
    // Törlés mód
    if (this.deleteMode) {
      this.confirmDelete(shot);
      return;
    }

    // Szerkesztés mód
    // if (this.editMode) {
    //   if (shot.shotId != null) {
    //     this.router.navigate(['/shots/edit', shot.shotId]);
    //   }
    //   return;
    // }

    // Normál kattintás
    if (shot.shotId != null) {
      this.router.navigate(['/shots', shot.shotId]);
    }
  }

  confirmDelete(shot: ShotDTO) {
    this.confirmDeleteShot = shot;
  }

  performDelete() {
    if (!this.confirmDeleteShot || this.confirmDeleteShot.shotId == null) return;

    this.shotService.delete(this.confirmDeleteShot.shotId).subscribe({
      next: () => {
        this.showToast(`A(z) ${this.confirmDeleteShot!.shotName} oltás sikeresen törölve.`);
        this.shots = this.shots.filter(s => s.shotId !== this.confirmDeleteShot!.shotId);
        this.confirmDeleteShot = null;
        this.deleteMode = false;
      },
      error: () => {
        this.showToast('Nem sikerült törölni az oltást.');
        this.confirmDeleteShot = null;
        this.deleteMode = false;
      }
    });
  }

  cancelDelete() {
    this.confirmDeleteShot = null;
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
        label: 'Új oltás hozzáadása',
        icon: 'add_circle',
        onClick: () => {
          this.editMode = false;
          this.deleteMode = false;
          this.confirmDeleteShot = null;
          this.addShot();
        }
      },
      // {
      //   label: 'Szerkesztés mód',
      //   icon: 'edit',
      //   onClick: () => {
      //     this.editMode = !this.editMode;
      //     this.deleteMode = false;
      //     this.confirmDeleteShot = null;
      //     this.toastVisible = false;
      //   }
      // },
      {
        label: 'Törlés mód',
        icon: 'delete',
        onClick: () => {
          this.deleteMode = !this.deleteMode;
          this.editMode = false;
          this.confirmDeleteShot = null;
          this.toastVisible = false;
        }
      }
    ];
  }

  frequencyLabels: { [key: string]: string } = {
    DAYS: 'Nap',
    WEEKS: 'Hét',
    MONTHS: 'Hónap',
    YEARS: 'Év'
  };

  getFrequencyLabel(shot: ShotDTO): string {
    if (!shot.frequencyValue || !shot.frequencyUnit) return '-';

    const unitLabel = this.frequencyLabels[shot.frequencyUnit] || shot.frequencyUnit;
    return `${shot.frequencyValue} ${unitLabel}`;
  }
}
