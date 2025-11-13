import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HorseService } from '../../services/horse.service';
import { HorseDTO } from '../../models/horse.model';
import { StableService } from '../../services/stable.service';
import { StableDTO } from '../../models/stable.model';
import { UserService } from '../../services/user.service';   // <-- NEW


@Component({
  selector: 'app-horse-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './horse-edit.html',
  styleUrls: ['./horse-edit.css']
})
export class HorseEditPage implements OnInit {
  loading: boolean = false;

  horse: HorseDTO = {
    horseName: '',
    dob: '',
    sex: 'M',
    microchipNum: '',
    passportNum: '',
    additional: ''
  };

  stables: StableDTO[] = [];
  owners: any[] = [];
  error: string | null = null;
  success = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private horseService: HorseService,
    private stableService: StableService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.loading = true;

    this.horseService.getById(id).subscribe(h => {
      this.horse = h;
      this.loading = false;
    });

    this.stableService.getAll().subscribe(st => (this.stables = st));

    this.userService.getAllOwners().subscribe(o => (this.owners = o));  // <-- NEW
  }

  onSubmit(): void {
    const dto: HorseDTO = {
      horseId: this.horse.horseId,
      horseName: this.horse.horseName,
      dob: this.horse.dob,
      sex: this.horse.sex,
      ownerId: this.horse.ownerId,
      stableId: this.horse.stableId,
      microchipNum: this.horse.microchipNum,
      passportNum: this.horse.passportNum,
      additional: this.horse.additional
    };

    this.loading = true;

    this.horseService.update(this.horse.horseId!, dto).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        setTimeout(() => this.router.navigate(['/horses']), 1000);
      },
      error: () => {
        this.error = 'Nem sikerült frissíteni a ló adatait.';
        this.loading = false;
      }
    });
  }

  goBack(): void {
    if (window.history.length > 1) window.history.back();
    else this.router.navigate(['/horses']);
  }
}
