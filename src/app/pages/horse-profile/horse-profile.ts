import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HorseDTO } from '../../models/horse.model';
import { HorseService } from '../../services/horse.service';
import { CrudMenuComponent } from '../../components/crud-menu/crud-menu';
import { ShotDTO } from '../../models/shot.model';
import { ShotService } from '../../services/shot.service';
import { HorseShotService } from '../../services/horse-shot.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-horse-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, CrudMenuComponent, FormsModule],
  templateUrl: './horse-profile.html',
  styleUrls: ['./horse-profile.css']
})
export class HorseProfilePage implements OnInit {
    horse?: HorseDTO;
    loading = true;
    error = '';
    shots: ShotDTO[] = [];
    showAllShots = false;
    showVaccinationPopup = false;
    vaccinationOption: 'existing' | 'new' = 'existing';
    selectedShotId: number | null = null;
    allShots: ShotDTO[] = [];


    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private horseService: HorseService,
        private shotService: ShotService,
        private horseShotService: HorseShotService
    ) {}

    ngOnInit(): void {
        const navHorse = this.router.getCurrentNavigation()?.extras.state?.['horse'] as HorseDTO | undefined;
        if (navHorse) {
            this.horse = navHorse;
            this.loading = false;
            return;
        }

        const horseName = this.route.snapshot.paramMap.get('horseName');
        if (!horseName) {
            this.error = 'Nincs kiválasztott ló.';
            this.loading = false;
            return;
        }

        this.fetchHorse(horseName);
    }

    private fetchHorse(horsename: string): void {
      this.horseService.getAll().subscribe({
        next: (horses) => {
          this.horse = horses.find((horse) => horse.horseName === horsename);

          if (!this.horse) {
            this.error = 'Nem található ló ezzel a névvel.';
            this.loading = false;
            return;
          }

          this.loadShots(this.horse.id!);

          this.loading = false;
        },
        error: () => {
          this.error = 'Nem sikerült betölteni a ló adatait.';
          this.loading = false;
        }
      });
    }


    frequencyLabels: { [key: string]: string } = {
      'DAY': 'Nap',
      'DAYS': 'Nap',
      'NAP': 'Nap',

      'WEEK': 'Hét',
      'WEEKS': 'Hét',
      'HET': 'Hét',

      'MONTH': 'Hónap',
      'MONTHS': 'Hónap',

      'YEAR': 'Év',
      'YEARS': 'Év',
      'EV': 'Év'
    };


    loadShots(horseId: number): void {
      this.shotService.getAllOfHorseById(horseId).subscribe({
        next: (data) => {
          this.shots = data.sort((a, b) =>
            new Date(b.date!).getTime() - new Date(a.date!).getTime()
          );
        },
        error: () => {
          console.error("Nem sikerült betölteni az oltásokat.");
        }
      });
    }

    getFrequencyLabel(shot: ShotDTO): string {
      if (!shot.frequencyValue || !shot.frequencyUnit) return '-';

      const unit = shot.frequencyUnit.toUpperCase().trim();
      const unitLabel = this.frequencyLabels[unit] || unit;

      return `${shot.frequencyValue} ${unitLabel}`;
    }

    goBack(): void {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            this.router.navigate(['/horses']);
        }
    }

    goToShot(id: number): void {
      this.router.navigate(['/shots', id]);
    }

    getSexLabel(sex: string | null | undefined): string {
      switch (sex) {
          case 'G': return 'Herélt';
          case 'M': return 'Csődör';
          case 'F': return 'Kanca';
          default: return 'Ismeretlen';
      }
    }

    editHorse() {
      if (!this.horse?.id) return;
      this.router.navigate(['/horses/edit', this.horse.id]);
    }

    editFeeding() {
      console.log("Etetés szerkesztése");
    }

    addVaccination() {
      this.vaccinationOption = 'existing';
      this.selectedShotId = null;

      this.shotService.getAll().subscribe(shots => {
        this.allShots = shots;
        this.showVaccinationPopup = true;
      });
    }

    submitVaccination() {
      if (!this.horse?.id) return;

      if (this.vaccinationOption === 'existing') {

        if (!this.selectedShotId) return;

        this.horseShotService.addShotToHorse(this.selectedShotId, this.horse.id)
          .subscribe(() => {
            this.showVaccinationPopup = false;
            this.loadShots(this.horse!.id!);
          });

      } else {
        this.showVaccinationPopup = false;
        this.router.navigate(['/shots/new', this.horse!.id]);
      };
    }

    addShoeing() {
      console.log("Patkolás hozzáadása");
    }

    addTreatment() {
      console.log("Kezelés hozzáadása");
    }

    get crudActions() {
      return [
        {
          label: "Lóadatok szerkesztése",
          icon: "fa-pen-to-square",
          onClick: () => this.editHorse()
        },
        {
          label: "Etetés szerkesztése",
          icon: "fa-utensils",
          onClick: () => this.editFeeding()
        },
        {
          label: "Oltás hozzáadása",
          icon: "fa-syringe",
          onClick: () => this.addVaccination()
        },
        {
          label: "Patkolás hozzáadása",
          icon: "fa-hammer",
          onClick: () => this.addShoeing()
        },
        {
          label: "Kezelés hozzáadása",
          icon: "fa-briefcase-medical",
          onClick: () => this.addTreatment()
        }
      ];
    }
}
