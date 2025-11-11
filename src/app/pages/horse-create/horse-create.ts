import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HorseService } from '../../services/horse.service';
import { StableService } from '../../services/stable.service';
import { AuthService } from '../../services/auth.service';
import { HorseDTO } from '../../models/horse.model';
import { StableDTO } from '../../models/stable.model';
import { UserDTO } from '../../models/user.model';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-horse-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './horse-create.html',
  styleUrls: ['./horse-create.css']
})
export class HorseCreatePage implements OnInit {
  horse: Partial<HorseDTO> = {
    horseName: '',
    dob: '',
    sex: undefined,
    passportNum: '',
    microchipNum: '',
    additional: '',
    stableName: '',
    ownerId: undefined
  };
  stables: StableDTO[] = [];
  users: UserDTO[] = [];
  loading = false;
  error = '';
  success = false;

  constructor(
    private horseService: HorseService,
    private stableService: StableService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // betöltjük az istállókat és felhasználókat
    this.stableService.getAll().subscribe({
      next: (data) => (this.stables = data),
      error: () => (this.error = 'Nem sikerült betölteni az istállókat.')
    });

    this.userService.getAll?.().subscribe({
      next: (data) => (this.users = data),
      error: () => (this.error = 'Nem sikerült betölteni a felhasználókat.')
    });
  }

  onSubmit(): void {
    this.error = '';
    this.success = false;
    this.loading = true;

    this.horseService.create(this.horse as HorseDTO).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        setTimeout(() => this.router.navigate(['/horses']), 1500);
      },
      error: (err) => {
        console.error(err);
        this.error = 'Nem sikerült létrehozni a lovat.';
        this.loading = false;
      }
    });
  }
}
