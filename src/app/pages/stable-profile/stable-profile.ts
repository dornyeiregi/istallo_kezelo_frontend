import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StableService } from '../../services/stable.service';
import { StableDTO } from '../../models/stable.model';
import { CrudMenuComponent } from '../../components/crud-menu/crud-menu';


@Component({
  selector: 'app-stable-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, CrudMenuComponent],
  templateUrl: './stable-profile.html',
  styleUrls: ['./stable-profile.css']
})
export class StableProfilePage implements OnInit {
  stable?: StableDTO;
  loading = true;
  error = '';
  readonly averageHayPerHorseKg = 10;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stableService: StableService
  ) {}

  ngOnInit(): void {
    const navStable = this.router.getCurrentNavigation()?.extras.state?.['stable'] as StableDTO | undefined;
    if (navStable) {
      this.stable = navStable;
      this.loading = false;
      return;
    }

    const stableName = this.route.snapshot.paramMap.get('stableName');
    if (!stableName) {
      this.error = 'Nincs kiválasztott istálló.';
      this.loading = false;
      return;
    }

    this.fetchStable(stableName);
  }

  get horseCount(): number {
    return this.stable?.horses ? this.stable.horses.length : 0;
  }

  get estimatedDailyHayKg(): number {
    return this.horseCount * this.averageHayPerHorseKg;
  }

  private fetchStable(stableName: string): void {
    this.stableService.getAll().subscribe({
      next: (stables) => {
        this.stable = stables.find((stable) => stable.stableName === stableName);
        if (!this.stable) {
          this.error = 'Nem található ilyen nevű istálló.';
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni az istálló adatait.';
        this.loading = false;
      }
    });
  }

  addStable() {
    this.router.navigate(['/horses/new'])
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
}
