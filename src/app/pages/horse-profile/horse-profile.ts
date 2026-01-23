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
import { TreatmentDTO } from '../../models/treatment.model';
import { TreatmentService } from '../../services/treatment.service';
import { FarrierAppDTO } from '../../models/farrier-app.model';
import { FarrierAppService } from '../../services/farrier-app.service';
import { FeedSchedDTO } from '../../models/feed-sched.model';
import { FeedSchedService } from '../../services/feed-sched.service';
import { HorseFeedSchedService } from '../../services/horse-feed-sched.service';
import { HorseFeedSchedDTO } from '../../models/horse-feed-sched.model';
import { HorseFarrierAppService } from '../../services/horse-farrier-app.service';
import { HorseFarrierAppDTO } from '../../models/horse-farrier-app.model';
import { HorseTreatmentService } from '../../services/horse-treatment.service';
import { HorseTreatmentDTO } from '../../models/horse-treatment.model';

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
    treatments: TreatmentDTO[] = [];
    showAllTreatments = false;
    showTreatmentPopup = false;
    treatmentOption: 'existing' | 'new' = 'existing';
    selectedTreatmentId: number | null = null;
    allTreatments: TreatmentDTO[] = [];
    farrierApps: FarrierAppDTO[] = [];
    showAllFarrierApps = false;
    showFarrierPopup = false;
    farrierOption: 'existing' | 'new' = 'existing';
    selectedFarrierAppId: number | null = null;
    allFarrierApps: FarrierAppDTO[] = [];
    feedScheds: FeedSchedDTO[] = [];
    showAllFeedScheds = false;
    showFeedPopup = false;
    feedOption: 'existing' | 'new' = 'existing';
    selectedFeedSchedId: number | null = null;
    allFeedScheds: FeedSchedDTO[] = [];


    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private horseService: HorseService,
        private shotService: ShotService,
        private horseShotService: HorseShotService,
        private treatmentService: TreatmentService,
        private farrierAppService: FarrierAppService,
        private feedSchedService: FeedSchedService,
        private horseFeedSchedService: HorseFeedSchedService,
        private horseFarrierAppService: HorseFarrierAppService,
        private horseTreatmentService: HorseTreatmentService
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
          this.loadTreatments(this.horse.id!);
          this.loadFarrierApps(this.horse.id!);
          this.loadFeedScheds(this.horse.id!);

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

    feedTimeLabels: { [key: string]: string } = {
      MORNING: 'Reggel',
      NOON: 'Dél',
      EVENING: 'Este'
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

    loadTreatments(horseId: number): void {
      this.treatmentService.getAllOfHorseById(horseId).subscribe({
        next: (data) => {
          this.treatments = data.sort((a, b) =>
            new Date(b.date!).getTime() - new Date(a.date!).getTime()
          );
        },
        error: () => {
          console.error("Nem sikerült betölteni a kezeléseket.");
        }
      });
    }

    loadFarrierApps(horseId: number): void {
      this.farrierAppService.getAllOfHorseById(horseId).subscribe({
        next: (data) => {
          this.farrierApps = data.sort((a, b) =>
            new Date(b.appointmentDate!).getTime() - new Date(a.appointmentDate!).getTime()
          );
        },
        error: () => {
          console.error("Nem sikerült betölteni a patkolási időpontokat.");
        }
      });
    }

    loadFeedScheds(horseId: number): void {
      this.feedSchedService.getAllOfHorseById(horseId).subscribe({
        next: (data) => {
          this.feedScheds = data.sort((a, b) =>
            (b.feedSchedId || 0) - (a.feedSchedId || 0)
          );
        },
        error: () => {
          console.error("Nem sikerült betölteni az etetési ütemterveket.");
        }
      });
    }

    getFrequencyLabel(shot: ShotDTO): string {
      if (!shot.frequencyValue || !shot.frequencyUnit) return '-';

      const unit = shot.frequencyUnit.toUpperCase().trim();
      const unitLabel = this.frequencyLabels[unit] || unit;

      return `${shot.frequencyValue} ${unitLabel}`;
    }

    getFeedTimeLabel(feed: FeedSchedDTO | null | undefined): string {
      if (!feed?.feedTime) return '-';
      return this.feedTimeLabels[feed.feedTime] || feed.feedTime;
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

    goToTreatment(id: number): void {
      this.router.navigate(['/treatments', id]);
    }

    goToFarrierApp(id: number): void {
      this.router.navigate(['/farrier-apps', id]);
    }

    goToFeedSched(id: number): void {
      this.router.navigate(['/feed-scheds', id]);
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
      this.treatmentOption = 'existing';
      this.selectedTreatmentId = null;

      this.treatmentService.getAll().subscribe(treatments => {
        this.allTreatments = treatments;
        this.showTreatmentPopup = true;
      });
    }

    addFarrierApp() {
      this.farrierOption = 'existing';
      this.selectedFarrierAppId = null;

      this.farrierAppService.getAll().subscribe(apps => {
        this.allFarrierApps = apps;
        this.showFarrierPopup = true;
      });
    }

    addFeedSched() {
      this.feedOption = 'existing';
      this.selectedFeedSchedId = null;

      this.feedSchedService.getAll().subscribe(list => {
        this.allFeedScheds = list;
        this.showFeedPopup = true;
      });
    }

    get crudActions() {
      return [
        {
          label: "Lóadatok szerkesztése",
          icon: "fa-pen-to-square",
          onClick: () => this.editHorse()
        },
        {
          label: "Etetés hozzáadása",
          icon: "fa-utensils",
          onClick: () => this.addFeedSched()
        },
        {
          label: "Oltás hozzáadása",
          icon: "fa-syringe",
          onClick: () => this.addVaccination()
        },
        {
          label: "Patkolás hozzáadása",
          icon: "fa-hammer",
          onClick: () => this.addFarrierApp()
        },
        {
          label: "Kezelés hozzáadása",
          icon: "fa-briefcase-medical",
          onClick: () => this.addTreatment()
        }
      ];
    }

    submitTreatment() {
      if (!this.horse?.id) return;

      if (this.treatmentOption === 'existing') {

        if (!this.selectedTreatmentId) return;

        const selected = this.allTreatments.find(
          f => f.treatmentId === this.selectedTreatmentId);
        if (!selected?.treatmentId) return;

        const dto: HorseTreatmentDTO = {
          horseId: this.horse.id,
          treatmentId: selected.treatmentId,
        };

        this.horseTreatmentService.create(dto)
          .subscribe(() => {
            this.showTreatmentPopup = false;
            this.loadTreatments(this.horse!.id!);
          });

      } else {
        this.showTreatmentPopup = false;
        this.router.navigate(['/treatments/new', this.horse!.id]);
      };
    }

    submitFarrierApp() {
      if (!this.horse?.id) return;

      if (this.farrierOption === 'existing') {

        if (!this.selectedFarrierAppId) return;

        const selected = this.allFarrierApps.find(
          f => f.farrierAppId === this.selectedFarrierAppId);
        if (!selected?.farrierAppId) return;

        const dto: HorseFarrierAppDTO = {
          horseId: this.horse.id,
          farrierAppId: selected.farrierAppId,
        };

        this.horseFarrierAppService.create(dto)
          .subscribe(() => {
            this.showFarrierPopup = false;
            this.loadFarrierApps(this.horse!.id!);
          });

      } else {
        this.showFarrierPopup = false;
        this.router.navigate(['/farrier-apps/new', this.horse!.id]);
      };
    }

    submitFeedSched() {
      if (!this.horse?.id) return;

      if (this.feedOption === 'existing') {

        if (!this.selectedFeedSchedId) return;

        const selected = this.allFeedScheds.find(
          f => f.feedSchedId === this.selectedFeedSchedId);
        if (!selected?.feedSchedId) return;

        const dto: HorseFeedSchedDTO = {
          horseId: this.horse.id,
          feedSchedId: selected.feedSchedId,
        };

        this.horseFeedSchedService.create(dto)
          .subscribe(() => {
            this.showFeedPopup = false;
            this.loadFeedScheds(this.horse!.id!);
          });

      } else {
        this.showFeedPopup = false;
        this.router.navigate(['/feed-scheds/new', this.horse!.id]);
      };
    }
}
