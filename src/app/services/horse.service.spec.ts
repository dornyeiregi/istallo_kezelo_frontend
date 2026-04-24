import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HorseService } from './horse.service';
import { API_BASE_URL } from '../config';
import { HorseDTO } from '../models/horse.model';

const API_URL = `${API_BASE_URL}/api/horses`;

describe('HorseService', () => {
  let service: HorseService;
  let httpMock: HttpTestingController;

  const horse: HorseDTO = {
    id: 1,
    horseName: 'Bella',
    dob: '2020-01-01',
    sex: 'MARE',
    microchipNum: 'chip-1',
    passportNum: 'pass-1',
    additional: 'healthy',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HorseService],
    });

    service = TestBed.inject(HorseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets all horses', () => {
    service.getAll().subscribe((data) => {
      expect(data).toEqual([horse]);
    });

    const req = httpMock.expectOne(`${API_URL}/all`);
    expect(req.request.method).toBe('GET');
    req.flush([horse]);
  });

  it('gets horse by id', () => {
    service.getById(1).subscribe((data) => {
      expect(data).toEqual(horse);
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(horse);
  });

  it('encodes horse name when getting by name', () => {
    service.getByName('Bella Star').subscribe((data) => {
      expect(data).toEqual(horse);
    });

    const req = httpMock.expectOne(`${API_URL}/byName/Bella%20Star`);
    expect(req.request.method).toBe('GET');
    req.flush(horse);
  });

  it('creates horse with POST body', () => {
    service.create(horse).subscribe((data) => {
      expect(data).toEqual(horse);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(horse);
    req.flush(horse);
  });

  it('updates horse with PATCH body', () => {
    service.update(1, horse).subscribe((data) => {
      expect(data).toEqual(horse);
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(horse);
    req.flush(horse);
  });

  it('deletes horse as text response', () => {
    service.delete(1).subscribe((data) => {
      expect(data).toBe('deleted');
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.responseType).toBe('text');
    req.flush('deleted');
  });

  it('approves horse request with payload', () => {
    const payload = { stableId: 2, feedSchedId: 3 };

    service.approveRequest(1, payload).subscribe((data) => {
      expect(data).toEqual(horse);
    });

    const req = httpMock.expectOne(`${API_URL}/requests/1/approve`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(payload);
    req.flush(horse);
  });

  it('rejects horse request as text response', () => {
    service.rejectRequest(1).subscribe((data) => {
      expect(data).toBe('rejected');
    });

    const req = httpMock.expectOne(`${API_URL}/requests/1`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.responseType).toBe('text');
    req.flush('rejected');
  });
});
