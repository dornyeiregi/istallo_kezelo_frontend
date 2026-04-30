import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HorseFarrierAppService } from './horse-farrier-app.service';
import { API_BASE_URL } from '../config';
import { HorseFarrierAppDTO } from '../models/horse-farrier-app.model';

const API_URL = `${API_BASE_URL}/api/horseFarrierApps`;

describe('HorseFarrierAppService', () => {
  let service: HorseFarrierAppService;
  let httpMock: HttpTestingController;

  const link: HorseFarrierAppDTO = {
    horseId: 1,
    farrierAppId: 2,
    horseName: 'Star',
    farrierName: 'John Farrier',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HorseFarrierAppService],
    });

    service = TestBed.inject(HorseFarrierAppService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets all horse farrier links', () => {
    service.getAll().subscribe((data) => {
      expect(data).toEqual([link]);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('GET');
    req.flush([link]);
  });

  it('gets horse farrier link by id', () => {
    service.getById(1).subscribe((data) => {
      expect(data).toEqual(link);
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(link);
  });

  it('gets horse farrier links by horse id', () => {
    service.getAllOfHorseById(3).subscribe((data) => {
      expect(data).toEqual([link]);
    });

    const req = httpMock.expectOne(`${API_URL}/byHorseId/3`);
    expect(req.request.method).toBe('GET');
    req.flush([link]);
  });

  it('creates horse farrier link with POST body', () => {
    service.create(link).subscribe((data) => {
      expect(data).toEqual(link);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(link);
    req.flush(link);
  });
});
