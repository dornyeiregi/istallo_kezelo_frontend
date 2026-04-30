import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { StableCreatePage } from './stable-create';
import { StableService } from '../../services/stable.service';
import { configurePageTest } from '../../testing/page-test-helpers';

describe('StableCreatePage', () => {
  let fixture: ComponentFixture<StableCreatePage>;
  let component: StableCreatePage;
  let stableService: jasmine.SpyObj<StableService>;
  let router: jasmine.SpyObj<Router>;

  async function createComponent() {
    await configurePageTest(StableCreatePage, {
      emptyTemplate: true,
      providers: [
        { provide: StableService, useValue: stableService },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(StableCreatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    stableService = jasmine.createSpyObj<StableService>('StableService', ['create']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    stableService.create.and.returnValue(of({ stableId: 1 } as any));
  });

  it('shows error when creation fails', async () => {
    stableService.create.and.returnValue(throwError(() => new Error('fail')));

    await createComponent();

    component.onSubmit();

    expect(component.error).toBe('Nem sikerült létrehozni az istállót.');
    expect(component.loading).toBeFalse();
  });

  it('goes back in browser history when available', async () => {
    await createComponent();
    spyOn(window.history, 'back');
    spyOnProperty(window.history, 'length', 'get').and.returnValue(2);

    component.goBack();

    expect(window.history.back).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('navigates to the stable list when there is no browser history', async () => {
    await createComponent();
    spyOn(window.history, 'back');
    spyOnProperty(window.history, 'length', 'get').and.returnValue(1);

    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/stables']);
  });

  it('clears previous state and keeps loading until the create request resolves', async () => {
    const create$ = new Subject<any>();
    stableService.create.and.returnValue(create$);

    await createComponent();

    component.error = 'régi hiba';
    component.success = true;
    component.onSubmit();

    expect(component.error).toBe('');
    expect(component.success).toBeFalse();
    expect(component.loading).toBeTrue();
    expect(stableService.create).toHaveBeenCalledWith(component.stable);
  });

  it('navigates to stable list after successful creation', fakeAsync(async () => {
    await createComponent();

    component.stable.stableName = 'Main';
    component.onSubmit();
    tick(1500);

    expect(stableService.create).toHaveBeenCalledWith(jasmine.objectContaining({ stableName: 'Main' }));
    expect(component.success).toBeTrue();
    expect(router.navigate).toHaveBeenCalledWith(['/stables']);
  }));
});
