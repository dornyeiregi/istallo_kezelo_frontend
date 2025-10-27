import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HorseService } from '../../services/horse.service';
import { HorseDTO } from '../../models/horse.model';

@Component({
  selector: 'app-horses',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './horses.html',
  styleUrls: ['./horses.css']
})
export class HorsesPage implements OnInit {
  horses: HorseDTO[] = [];
  loading = true;
  error = '';

  constructor(private horseService: HorseService) {}

  ngOnInit(): void {
    this.loadHorses();
  }

  loadHorses(): void {
    this.horseService.getAll().subscribe({
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
}
