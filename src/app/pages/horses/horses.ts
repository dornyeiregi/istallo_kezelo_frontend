import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HorseService } from '../../services/horse.service';
import { HorseDTO } from '../../models/horse.model';
import { CrudMenuComponent } from '../../components/crud-menu/crud-menu';

@Component({
  selector: 'app-horses',
  standalone: true,
  imports: [CommonModule, RouterLink, CrudMenuComponent],
  templateUrl: './horses.html',
  styleUrls: ['./horses.css']
})
export class HorsesPage implements OnInit {
  horses: HorseDTO[] = [];
  loading = true;
  error = '';

  constructor(
    private horseService: HorseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadHorses();
  }

  loadHorses(): void {
    this.loading = true;
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

  get crudActions() {
    return [
      {
        label: 'Új ló hozzáadása',
        icon: 'add_circle',
        onClick: () => this.addHorse()
      },
      {
        label: 'Szerkesztés',
        icon: 'edit',
        onClick: () => this.editHorse()
      },
      {
        label: 'Törlés',
        icon: 'delete',
        onClick: () => this.deleteHorse()
      }
    ];
  }

  addHorse(): void {
    this.router.navigate(['/horses/new']);
  }

  editHorse(): void {
    alert('Ló szerkesztése funkció hamarosan...');
  }

  deleteHorse(): void {
    alert('Ló törlése funkció hamarosan...');
  }

  getSexLabel(sex: string | null | undefined): string {
    switch (sex) {
      case 'G':
        return 'Herélt';
      case 'M':
        return 'Csődör';
      case 'F':
        return 'Kanca';
      default:
        return 'Ismeretlen';
    }
  }
}
