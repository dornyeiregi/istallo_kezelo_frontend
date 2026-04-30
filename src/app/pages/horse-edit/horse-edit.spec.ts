import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HorseEditPage } from './horse-edit';
import { HorseService } from '../../services/horse.service';
import { StableService } from '../../services/stable.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { configurePageTest } from '../../testing/page-test-helpers';

describe('HorseEditPage', () => {
  let fixture: ComponentFixture<HorseEditPage>;
  let component: HorseEditPage;
  let horseService: jasmine.SpyObj<HorseService>;
  let stableService: jasmine.SpyObj<StableService>;
  let userService: jasmine.SpyObj<UserService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const horse = {
    id: 1,
    horseName: 'Csillag',
    dob: '2020-01-01',
    sex: 'M',
    microchipNum: 'chip-1',
    passportNum: 'pass-1',
    additional: '',
  };

  async function createComponent(paramId = '1') {
    await configurePageTest(HorseEditPage, {
      paramMap: { id: paramId },
      providers: [
        { provide: HorseService, useValue: horseService },
        { provide: StableService, useValue: stableService },
        { provide: UserService, useValue: userService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(HorseEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    horseService = jasmine.createSpyObj<HorseService>('HorseService', ['getById', 'update']);
    stableService = jasmine.createSpyObj<StableService>('StableService', ['getAll']);
    userService = jasmine.createSpyObj<UserService>('UserService', ['getAll']);

    horseService.getById.and.returnValue(of(horse as any));
    horseService.update.and.returnValue(of(horse as any));
    stableService.getAll.and.returnValue(of([]));
    userService.getAll.and.returnValue(of([{ userId: 5, username: 'owner1' }] as any));
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['hasAnyRole']);
    authService.hasAnyRole.and.returnValue(false);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
  });

  it('shows error for invalid route id', async () => {
    await createComponent('abc');

    expect(component.error).toBe('Érvénytelen ló azonosító.');
    expect(horseService.getById).not.toHaveBeenCalled();
  });

  it('shows error when horse cannot be loaded', async () => {
    horseService.getById.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.error).toBe('Nem sikerült betölteni a ló adatait.');
    expect(component.loading).toBeFalse();
  });

  it('shows error when stables cannot be loaded', async () => {
    stableService.getAll.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.error).toBe('Nem sikerült betölteni az istállókat.');
  });

  it('loads owners for admin users', async () => {
    authService.hasAnyRole.and.returnValue(true);

    await createComponent();

    expect(userService.getAll).toHaveBeenCalled();
    expect(component.owners).toEqual([{ userId: 5, username: 'owner1' }] as any);
  });

  it('shows error when owners cannot be loaded for admins', async () => {
    authService.hasAnyRole.and.returnValue(true);
    userService.getAll.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    expect(component.error).toBe('Nem sikerült betölteni a tulajdonosokat.');
  });

  it('shows error when update fails', async () => {
    horseService.update.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.onSubmit();

    expect(component.error).toBe('Nem sikerült frissíteni a ló adatait.');
    expect(component.loading).toBeFalse();
  });

  it('submits owner id for admins and navigates back to the stable page when requested', fakeAsync(async () => {
    authService.hasAnyRole.and.returnValue(true);
    window.history.replaceState({ returnToStable: '7' }, '');

    await createComponent();

    component.horse = {
      ...horse,
      ownerId: 12,
      stableId: 4,
    } as any;
    component.onSubmit();
    tick(800);

    expect(horseService.update).toHaveBeenCalledWith(
      1,
      jasmine.objectContaining({
        ownerId: 12,
        stableId: 4,
      }),
    );
    expect(router.navigate).toHaveBeenCalledWith(['/stables', '7']);
    window.history.replaceState({}, '');
  }));

  it('omits owner id for non-admin updates and navigates to the horse list', fakeAsync(async () => {
    await createComponent();

    component.horse = {
      ...horse,
      ownerId: 15,
      stableId: 4,
    } as any;
    component.onSubmit();
    tick(800);

    expect(horseService.update).toHaveBeenCalledWith(
      1,
      jasmine.objectContaining({
        ownerId: undefined,
        stableId: 4,
      }),
    );
    expect(router.navigate).toHaveBeenCalledWith(['/horses']);
  }));

  it('uses browser history when available on goBack', async () => {
    await createComponent();
    spyOn(window.history, 'back');
    spyOnProperty(window.history, 'length', 'get').and.returnValue(2);

    component.goBack();

    expect(window.history.back).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('navigates to the horse list when browser history is not available', async () => {
    await createComponent();
    spyOn(window.history, 'back');
    spyOnProperty(window.history, 'length', 'get').and.returnValue(1);

    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/horses']);
  });
});
