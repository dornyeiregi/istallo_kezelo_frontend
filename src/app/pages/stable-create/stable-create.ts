import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StableService } from '../../services/stable.service';
import { StableDTO } from '../../models/stable.model';

@Component({
  selector: 'app-stable-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stable-create.html',
  styleUrls: ['./stable-create.css']
})

export class StableCreatePage {
  stable: StableDTO = {
    stableName: '',
    horses: []
  } as StableDTO;

  loading = false;
  error = '';
  success = false;

  constructor(private stableService: StableService, private router: Router) {}

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/stables']);
    }
  }

  onSubmit(): void {
    this.error = '';
    this.success = false;
    this.loading = true;

    this.stableService.create(this.stable).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;

        setTimeout(() => this.router.navigate(['/stables']), 1500);
      },
      error: (err) => {
        console.error('Mentési hiba:', err);
        this.error = 'Nem sikerült létrehozni az istállót.';
        this.loading = false;
      }
    });
  }
}
