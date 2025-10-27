import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StableService } from '../../services/stable.service';
import { StableDTO } from '../../models/stable.model';

@Component({
  selector: 'app-stables',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stables.html',
  styleUrls: ['./stables.css']
})
export class StablesPage implements OnInit {
  stables: StableDTO[] = [];
  loading = true;
  error = '';

  constructor(private stableService: StableService) {}

  ngOnInit(): void {
    this.loadStables();
  }

  loadStables(): void {
    this.stableService.getAll().subscribe({
      next: (data) => {
        this.stables = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni az istállókat.';
        this.loading = false;
      }
    });
  }
}
