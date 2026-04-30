import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HorseService } from '../../services/horse.service';
import { HorseDTO } from '../../models/horse.model';
import { StableService } from '../../services/stable.service';
import { StableDTO } from '../../models/stable.model';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-horse-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './horse-edit.html',
  styleUrls: ['./horse-edit.css'],
})
export class HorseEditPage implements OnInit {
  loading: boolean = false;

  horse: HorseDTO = {
    horseName: '',
    dob: '',
    sex: 'M',
    microchipNum: '',
    passportNum: '',
    additional: '',
  };

  stables: StableDTO[] = [];
  owners: any[] = [];
  error: string | null = null;
  success = false;

  returnToStable: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private horseService: HorseService,
    private stableService: StableService,
    private userService: UserService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.returnToStable = history.state?.['returnToStable'] || null;

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id <= 0) {
      this.error = 'Érvénytelen ló azonosító.';
      this.loading = false;
      return;
    }

    this.loading = true;

    this.horseService.getById(id).subscribe({
      next: (h) => {
        this.horse = h;
        this.loading = false;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni a ló adatait.';
        this.loading = false;
      },
    });

    this.stableService.getAll().subscribe({
      next: (st) => {
        this.stables = st;
      },
      error: () => {
        this.error ??= 'Nem sikerült betölteni az istállókat.';
      },
    });

    if (this.isAdmin) {
      this.userService.getAll().subscribe({
        next: (o) => {
          this.owners = o;
        },
        error: () => {
          this.error ??= 'Nem sikerült betölteni a tulajdonosokat.';
        },
      });
    }
  }

  get isAdmin(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'ROLE_ADMIN']);
  }

  onSubmit(): void {
    const dto: HorseDTO = {
      id: this.horse.id,
      horseName: this.horse.horseName,
      dob: this.horse.dob,
      sex: this.horse.sex,
      ownerId: this.isAdmin ? this.horse.ownerId : undefined,
      stableId: this.horse.stableId,
      microchipNum: this.horse.microchipNum,
      passportNum: this.horse.passportNum,
      additional: this.horse.additional,
    };

    this.loading = true;

    this.horseService.update(this.horse.id!, dto).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;

        setTimeout(() => {
          if (this.returnToStable) {
            this.router.navigate(['/stables', this.returnToStable]);
          } else {
            this.router.navigate(['/horses']);
          }
        }, 800);
      },
      error: () => {
        this.error = 'Nem sikerült frissíteni a ló adatait.';
        this.loading = false;
      },
    });
  }

  goBack(): void {
    if (window.history.length > 1) window.history.back();
    else this.router.navigate(['/horses']);
  }
}
