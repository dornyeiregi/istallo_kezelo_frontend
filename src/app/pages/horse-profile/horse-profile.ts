import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
import { HorseFarrierAppService } from '../../services/horse-farrier-app.service';
import { HorseFarrierAppDTO } from '../../models/horse-farrier-app.model';
import { HorseTreatmentService } from '../../services/horse-treatment.service';
import { HorseTreatmentDTO } from '../../models/horse-treatment.model';
import { AuthService } from '../../services/auth.service';
import { forkJoin, Observable, of } from 'rxjs';
import { ItemService } from '../../services/item.service';
import { ItemDTO } from '../../models/item.model';

@Component({
  selector: 'app-horse-profile',
  standalone: true,
  imports: [CommonModule, CrudMenuComponent, FormsModule],
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
    showFeedEditor = false;
    feedEditorError = '';
    expandedFeedSchedId: number | null = null;
    items: ItemDTO[] = [];
    horsesForFeed: HorseDTO[] = [];
    otherHorsesForFeed: HorseDTO[] = [];
    feedEditor = this.createEmptyFeedEditor();


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
        private itemService: ItemService,
        private horseFarrierAppService: HorseFarrierAppService,
        private horseTreatmentService: HorseTreatmentService,
        private authService: AuthService
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
      const isOwner = this.authService.hasAnyRole(['OWNER', 'ROLE_OWNER']);
      if (isOwner) {
        forkJoin([
          this.horseService.getAll(),
          this.horseService.getMyRequests()
        ]).subscribe({
          next: ([horses, pending]) => {
            const merged = [...horses, ...pending];
            this.horse = merged.find((horse) => horse.horseName === horsename);

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
      } else {
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
      const isOwner = this.authService.hasAnyRole(['OWNER', 'ROLE_OWNER']);
      const pending$ = isOwner ? this.horseService.getMyRequests() : of([]);

      forkJoin({
        feedScheds: this.feedSchedService.getAllOfHorseById(horseId),
        items: this.itemService.getAll(),
        horses: this.horseService.getAll(),
        pending: pending$
      }).subscribe({
        next: ({ feedScheds, items, horses, pending }) => {
          this.feedScheds = feedScheds.sort((a, b) =>
            (b.feedSchedId || 0) - (a.feedSchedId || 0)
          );
          this.items = items;
          this.horsesForFeed = this.mergeHorses(horses, pending as HorseDTO[]);
          this.otherHorsesForFeed = this.horsesForFeed.filter(h => h.id !== this.currentHorseId);
          this.refreshFeedEditorFromExisting();
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

    getFeedSchedDisplayName(feed: FeedSchedDTO | null | undefined): string {
      if (!feed) return '-';
      const timeLabel = this.getFeedTimesLabel(feed);
      const idPart = feed.feedSchedId != null ? `_${feed.feedSchedId}` : '';
      return `${timeLabel}${idPart}`;
    }

    getFeedTimeLabel(feed: FeedSchedDTO | null | undefined): string {
      if (!feed) return '-';
      return this.getFeedTimesLabel(feed);
    }

    private getFeedTimesLabel(feed: FeedSchedDTO): string {
      const parts: string[] = [];
      if (feed.feedMorning) parts.push('Reggel');
      if (feed.feedNoon) parts.push('Dél');
      if (feed.feedEvening) parts.push('Este');
      return parts.length ? parts.join(' + ') : '-';
    }

    toggleFeedProfile(feed: FeedSchedDTO): void {
      const id = feed.feedSchedId;
      if (id == null) return;
      this.expandedFeedSchedId = this.expandedFeedSchedId === id ? null : id;
    }

    isFeedExpanded(feed: FeedSchedDTO): boolean {
      if (feed.feedSchedId == null) return false;
      return this.expandedFeedSchedId === feed.feedSchedId;
    }

    getFeedHorseNames(feed: FeedSchedDTO): string[] {
      if (!feed.horseIds || feed.horseIds.length === 0) return [];
      return feed.horseIds.map(id => this.getHorseNameById(id));
    }

    getFeedItemDetails(feed: FeedSchedDTO): string[] {
      if (feed.items && feed.items.length > 0) {
        return feed.items.map(item => {
          const name = this.getItemNameById(item.itemId);
          const amount = Number.isFinite(item.amount) ? item.amount : 0;
          return `${name} (${amount})`;
        });
      }
      if (feed.itemIds && feed.itemIds.length > 0) {
        return feed.itemIds.map(id => this.getItemNameById(id));
      }
      return [];
    }

    getFeedSchedsForTime(time: FeedTimeKey): FeedSchedDTO[] {
      return this.feedScheds.filter(feed => {
        if (time === 'morning') return !!feed.feedMorning;
        if (time === 'noon') return !!feed.feedNoon;
        return !!feed.feedEvening;
      });
    }

    private getItemNameById(itemId: number): string {
      const found = this.items.find(i => i.itemId === itemId);
      return found?.name || `Tétel #${itemId}`;
    }

    private getHorseNameById(horseId: number): string {
      const found = this.horsesForFeed.find(h => h.id === horseId);
      return found?.horseName || `Ló #${horseId}`;
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
      if (!this.horse?.id) return;
      this.feedEditorError = '';
      this.feedEditor = this.createEmptyFeedEditor();
      this.openFeedEditor();
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

    submitFeedEditor() {
      if (!this.horse?.id) return;
      this.feedEditorError = '';

      const hasAnyTime = this.feedEditor.morning.enabled
        || this.feedEditor.noon.enabled
        || this.feedEditor.evening.enabled;
      if (!hasAnyTime) {
        this.horseFeedSchedService.deleteAllForHorse(this.horse.id)
          .subscribe(() => {
            this.showFeedEditor = false;
            this.loadFeedScheds(this.horse!.id!);
          });
        return;
      }

      const tasks = this.buildFeedSchedTasks();
      if (tasks.length === 0) {
        this.feedEditorError = 'Legalább egy időpontot válassz ki etetéshez.';
        return;
      }

      forkJoin(tasks).subscribe({
        next: () => {
          this.showFeedEditor = false;
          this.loadFeedScheds(this.horse!.id!);
        },
        error: () => {
          this.feedEditorError = 'Nem sikerült létrehozni az etetési ütemtervet.';
        }
      });
    }

    cancelFeedEditor() {
      this.showFeedEditor = false;
    }

    toggleFeedItem(time: FeedTimeKey, itemId: number) {
      const block = this.feedEditor[time];
      if (block.itemIds.includes(itemId)) {
        block.itemIds = block.itemIds.filter(id => id !== itemId);
        delete block.itemAmounts[itemId];
      } else {
        block.itemIds = [...block.itemIds, itemId];
        if (!Number.isFinite(block.itemAmounts[itemId] as number)) {
          block.itemAmounts[itemId] = 1;
        }
      }
    }

    isFeedItemSelected(time: FeedTimeKey, itemId: number): boolean {
      return this.feedEditor[time].itemIds.includes(itemId);
    }

    updateFeedItemAmount(time: FeedTimeKey, itemId: number, value: string) {
      const num = Number(value);
      this.feedEditor[time].itemAmounts[itemId] = Number.isFinite(num) ? num : 0;
    }

    toggleHorseSelection(time: FeedTimeKey, horseId: number) {
      const block = this.feedEditor[time];
      if (block.horseIds.includes(horseId)) {
        block.horseIds = block.horseIds.filter(id => id !== horseId);
      } else {
        block.horseIds = [...block.horseIds, horseId];
      }
      this.ensureCurrentHorse(time);
    }

    onToggleOtherHorses(time: FeedTimeKey) {
      const block = this.feedEditor[time];
      if (!block.includeOtherHorses) {
        block.horseIds = this.currentHorseId ? [this.currentHorseId] : [];
      } else {
        this.ensureCurrentHorse(time);
      }
    }

    get currentHorseId(): number | null {
      return this.horse?.id ?? null;
    }

    private ensureCurrentHorse(time: FeedTimeKey) {
      if (!this.currentHorseId) return;
      const block = this.feedEditor[time];
      if (!block.horseIds.includes(this.currentHorseId)) {
        block.horseIds = [...block.horseIds, this.currentHorseId];
      }
    }

    private openFeedEditor() {
      const isOwner = this.authService.hasAnyRole(['OWNER', 'ROLE_OWNER']);
      if (isOwner) {
        forkJoin({
          horses: this.horseService.getAll(),
          pending: this.horseService.getMyRequests(),
          items: this.itemService.getAll()
        }).subscribe({
          next: ({ horses, pending, items }) => {
            this.horsesForFeed = this.mergeHorses(horses, pending);
            this.otherHorsesForFeed = this.horsesForFeed.filter(h => h.id !== this.currentHorseId);
            this.items = items;
            this.refreshFeedEditorFromExisting();
            this.showFeedEditor = true;
          },
          error: () => {
            this.horsesForFeed = [];
            this.otherHorsesForFeed = [];
            this.items = [];
            this.refreshFeedEditorFromExisting();
            this.showFeedEditor = true;
          }
        });
      } else {
        forkJoin({
          horses: this.horseService.getAll(),
          items: this.itemService.getAll()
        }).subscribe({
          next: ({ horses, items }) => {
            this.horsesForFeed = horses;
            this.otherHorsesForFeed = this.horsesForFeed.filter(h => h.id !== this.currentHorseId);
            this.items = items;
            this.refreshFeedEditorFromExisting();
            this.showFeedEditor = true;
          },
          error: () => {
            this.horsesForFeed = [];
            this.otherHorsesForFeed = [];
            this.items = [];
            this.refreshFeedEditorFromExisting();
            this.showFeedEditor = true;
          }
        });
      }
    }

    private mergeHorses(active: HorseDTO[], pending: HorseDTO[]): HorseDTO[] {
      const byId = new Map<number, HorseDTO>();
      for (const h of active) {
        if (h.id != null) byId.set(h.id, h);
      }
      for (const h of pending) {
        if (h.id != null && !byId.has(h.id)) byId.set(h.id, h);
      }
      return Array.from(byId.values());
    }

    private buildFeedSchedTasks(): Observable<unknown>[] {
      const tasks: Observable<unknown>[] = [];
      const horseId = this.currentHorseId;
      if (!horseId) return tasks;
      let hasError = false;

      const pushIfEnabled = (time: FeedTimeKey, label: string, flags: Partial<FeedSchedDTO>) => {
        const block = this.feedEditor[time];
        if (!block.enabled) return;

        if (block.itemIds.length === 0) {
          this.feedEditorError = 'Minden kijelölt időponthoz adj meg legalább egy tételt.';
          hasError = true;
          return;
        }

        const items = block.itemIds.map(itemId => ({
          itemId,
          amount: Number(block.itemAmounts[itemId] || 0)
        }));

        if (items.some(i => !Number.isFinite(i.amount) || i.amount <= 0)) {
          this.feedEditorError = 'Minden tételhez adj meg pozitív mennyiséget.';
          hasError = true;
          return;
        }

        const horseIds = Array.from(new Set([horseId, ...block.horseIds]));

        const dto: FeedSchedDTO = {
          feedMorning: !!flags.feedMorning,
          feedNoon: !!flags.feedNoon,
          feedEvening: !!flags.feedEvening,
          description: block.existingDescription || '',
          horseIds,
          itemIds: block.itemIds,
          items
        };

        if (block.existingFeedSchedId != null) {
          tasks.push(this.feedSchedService.update(block.existingFeedSchedId, dto));
        } else {
          tasks.push(this.feedSchedService.create(dto));
        }
      };

      pushIfEnabled('morning', 'REGGEL', { feedMorning: true, feedNoon: false, feedEvening: false });
      pushIfEnabled('noon', 'DEL', { feedMorning: false, feedNoon: true, feedEvening: false });
      pushIfEnabled('evening', 'ESTE', { feedMorning: false, feedNoon: false, feedEvening: true });

      return hasError ? [] : tasks;
    }

    private refreshFeedEditorFromExisting() {
      this.feedEditor = this.createEmptyFeedEditor();
      const existing = this.getExistingFeedSchedsByTime();

      (['morning', 'noon', 'evening'] as FeedTimeKey[]).forEach((time) => {
        const feed = existing[time];
        if (!feed) return;
        const block = this.feedEditor[time];
        block.enabled = true;
        block.existingFeedSchedId = feed.feedSchedId ?? null;
        block.existingDescription = feed.description || '';
        block.itemIds = feed.itemIds ? [...feed.itemIds] : [];
        block.itemAmounts = this.buildItemAmounts(feed);
        block.horseIds = feed.horseIds ? [...feed.horseIds] : [];
        if (this.currentHorseId && !block.horseIds.includes(this.currentHorseId)) {
          block.horseIds = [...block.horseIds, this.currentHorseId];
        }
        block.includeOtherHorses = block.horseIds.some(id => id !== this.currentHorseId);
      });
    }

    private buildItemAmounts(feed: FeedSchedDTO): Record<number, number> {
      const amounts: Record<number, number> = {};
      if (feed.items && feed.items.length > 0) {
        feed.items.forEach(item => {
          amounts[item.itemId] = Number.isFinite(item.amount) ? item.amount : 0;
        });
      } else if (feed.itemIds) {
        feed.itemIds.forEach(id => {
          amounts[id] = 1;
        });
      }
      return amounts;
    }

    private getExistingFeedSchedsByTime(): Record<FeedTimeKey, FeedSchedDTO | null> {
      const result: Record<FeedTimeKey, FeedSchedDTO | null> = {
        morning: null,
        noon: null,
        evening: null
      };

      const withHorse = this.feedScheds.filter(feed =>
        this.currentHorseId != null && feed.horseIds?.includes(this.currentHorseId)
      );

      const pickLatest = (feeds: FeedSchedDTO[]): FeedSchedDTO | null => {
        if (feeds.length === 0) return null;
        return feeds.reduce((latest, current) => {
          const latestId = latest.feedSchedId ?? -1;
          const currentId = current.feedSchedId ?? -1;
          return currentId > latestId ? current : latest;
        });
      };

      result.morning = pickLatest(withHorse.filter(f => !!f.feedMorning));
      result.noon = pickLatest(withHorse.filter(f => !!f.feedNoon));
      result.evening = pickLatest(withHorse.filter(f => !!f.feedEvening));

      return result;
    }

    private createEmptyFeedEditor(): FeedEditorState {
      const base: FeedEditorBlock = {
        enabled: false,
        itemIds: [],
        itemAmounts: {},
        includeOtherHorses: false,
        horseIds: this.currentHorseId ? [this.currentHorseId] : [],
        existingFeedSchedId: null,
        existingDescription: ''
      };
      return {
        morning: { ...base, horseIds: base.horseIds ? [...base.horseIds] : [] },
        noon: { ...base, horseIds: base.horseIds ? [...base.horseIds] : [] },
        evening: { ...base, horseIds: base.horseIds ? [...base.horseIds] : [] }
      };
    }
}

type FeedTimeKey = 'morning' | 'noon' | 'evening';

type FeedEditorBlock = {
  enabled: boolean;
  itemIds: number[];
  itemAmounts: Record<number, number>;
  includeOtherHorses: boolean;
  horseIds: number[];
  existingFeedSchedId: number | null;
  existingDescription: string;
};

type FeedEditorState = {
  morning: FeedEditorBlock;
  noon: FeedEditorBlock;
  evening: FeedEditorBlock;
};
