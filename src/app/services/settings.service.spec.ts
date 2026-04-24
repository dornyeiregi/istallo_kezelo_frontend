import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SettingsService } from './settings.service';
import { API_BASE_URL } from '../config';
import { EmployeeAccessSettingsDTO } from '../models/employee-access-settings.model';

const API_URL = `${API_BASE_URL}/api/settings/employee-access`;

describe('SettingsService', () => {
  let service: SettingsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SettingsService],
    });

    service = TestBed.inject(SettingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('caches employee access result', () => {
    const payload: EmployeeAccessSettingsDTO = { calendar: true } as any;

    let first: EmployeeAccessSettingsDTO | undefined;
    let second: EmployeeAccessSettingsDTO | undefined;

    service.getEmployeeAccess().subscribe((data) => (first = data));
    service.getEmployeeAccess().subscribe((data) => (second = data));

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('GET');
    req.flush(payload);

    expect(first).toEqual(payload);
    expect(second).toEqual(payload);
  });

  it('updateEmployeeAccess resets cache', () => {
    const initial: EmployeeAccessSettingsDTO = { calendar: true } as any;
    const updated: EmployeeAccessSettingsDTO = { calendar: false } as any;

    service.getEmployeeAccess().subscribe();
    httpMock.expectOne(API_URL).flush(initial);

    service.updateEmployeeAccess(updated).subscribe((data) => {
      expect(data).toEqual(updated);
    });

    const patchReq = httpMock.expectOne(API_URL);
    expect(patchReq.request.method).toBe('PATCH');
    patchReq.flush(updated);

    service.getEmployeeAccess().subscribe();
    const newReq = httpMock.expectOne(API_URL);
    expect(newReq.request.method).toBe('GET');
    newReq.flush(updated);
  });
});
