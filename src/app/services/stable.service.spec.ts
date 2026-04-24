import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StableService } from './stable.service';
import { API_BASE_URL } from '../config';
import { StableDTO } from '../models/stable.model';

const API_URL = `${API_BASE_URL}/api/stables`;

describe('StableService', () => {
  let service: StableService;
  let httpMock: HttpTestingController;

  const stable: StableDTO = {
    stableId: 1,
    stableName: 'North Stable',
    strawUsageKg: 10,
    horses: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StableService],
    });

    service = TestBed.inject(StableService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets all stables', () => {
    service.getAll().subscribe((data) => {
      expect(data).toEqual([stable]);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('GET');
    req.flush([stable]);
  });

  it('creates stable with POST body', () => {
    service.create(stable).subscribe((data) => {
      expect(data).toEqual(stable);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(stable);
    req.flush(stable);
  });

  it('updates stable with PATCH body', () => {
    const patch: Partial<StableDTO> = { stableName: 'South Stable' };

    service.update(1, patch).subscribe((data) => {
      expect(data).toEqual({ ...stable, ...patch });
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(patch);
    req.flush({ ...stable, ...patch });
  });

  it('deletes stable as text response', () => {
    service.delete(1).subscribe((data) => {
      expect(data).toBe('deleted');
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.responseType).toBe('text');
    req.flush('deleted');
  });
});
