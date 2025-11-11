import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StableService } from '../../services/stable.service';
import { StableDTO } from '../../models/stable.model';
import { CrudMenuComponent } from '../../components/crud-menu/crud-menu';
import { Router, RouterLink } from '@angular/router';
import { Action } from 'rxjs/internal/scheduler/Action';

@Component({
  selector: 'app-stables',
  standalone: true,
  imports: [CommonModule, CrudMenuComponent, RouterLink],
  templateUrl: './stables.html',
  styleUrls: ['./stables.css']
})
export class StablesPage implements OnInit {
  stables: StableDTO[] = [];
  loading = true;
  error = '';
  readonly averageHayPerHorseKg = 10;

  constructor(private stableService: StableService,
              private router: Router
  ) {}

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

  addStable() {
    this.router.navigate(['/stables/new'])
  }

  editStable() {
    alert("Istálló szerkesztése");
  }

  deleteStable() {
    alert("Istálló törlése");
  }

  get crudActions() {
    return [
      { label: "Hozzáadás",
        icon: "add",
        onClick: () => this.addStable()
      },
      { label: "Szerkesztés", icon: "edit", onClick: () => this.editStable() },
      { label: "Törlés", icon: "delete", onClick: () => this.deleteStable() }
    ];
  }

  get totalHorseCount(): number {
    return this.stables.reduce((sum, stable) => {
      return sum + (stable.horses ? stable.horses.length : 0);
    }, 0);
  }

  get totalDailyHayKg(): number {
    return this.stables.reduce((sum, stable) => {
      return sum + this.estimateDailyHayForStable(stable);
    }, 0);
  }

  private estimateDailyHayForStable(stable: StableDTO): number {
    const horseCount = stable.horses ? stable.horses.length : 0;
    return horseCount * this.averageHayPerHorseKg;
  }
}
