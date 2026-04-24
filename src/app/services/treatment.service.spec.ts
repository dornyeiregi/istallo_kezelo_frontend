import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TreatmentService } from './treatment.service';
import { API_BASE_URL } from '../config';
import { TreatmentDTO } from '../models/treatment.model';

const API_URL = `${API_BASE_URL}/api/treatments`;

describe('TreatmentService', () => {
  let service: TreatmentService;
  let httpMock: HttpTestingController;

  const treatment: TreatmentDTO = {
    treatmentId: 1,
    treatmentName: 'Dental check',
    description: 'Annual dental control',
    date: '2026-01-10',
    horseIds: [1],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TreatmentService],
    });

    service = TestBed.inject(TreatmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets all treatments', () => {
    service.getAll().subscribe((data) => {
      expect(data).toEqual([treatment]);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('GET');
    req.flush([treatment]);
  });

  it('gets treatment by id', () => {
    service.getById(1).subscribe((data) => {
      expect(data).toEqual(treatment);
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(treatment);
  });

  it('gets treatments of horse by horse id', () => {
    service.getAllOfHorseById(2).subscribe((data) => {
      expect(data).toEqual([treatment]);
    });

    const req = httpMock.expectOne(`${API_URL}/horseId/2`);
    expect(req.request.method).toBe('GET');
    req.flush([treatment]);
  });

  it('creates treatment with POST body', () => {
    service.create(treatment).subscribe((data) => {
      expect(data).toEqual(treatment);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(treatment);
    req.flush(treatment);
  });

  it('updates treatment as text response', () => {
    service.update(1, treatment).subscribe((data) => {
      expect(data).toBe('updated');
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(treatment);
    expect(req.request.responseType).toBe('text');
    req.flush('updated');
  });

  it('deletes treatment as text response', () => {
    service.delete(1).subscribe((data) => {
      expect(data).toBe('deleted');
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.responseType).toBe('text');
    req.flush('deleted');
  });
});
