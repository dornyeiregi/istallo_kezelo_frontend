import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HorseTreatmentService } from './horse-treatment.service';
import { API_BASE_URL } from '../config';
import { HorseTreatmentDTO } from '../models/horse-treatment.model';

const API_URL = `${API_BASE_URL}/api/horseTreatments`;

describe('HorseTreatmentService', () => {
  let service: HorseTreatmentService;
  let httpMock: HttpTestingController;

  const link: HorseTreatmentDTO = {
    horseId: 1,
    treatmentId: 2,
    horseName: 'Star',
    treatmentName: 'Checkup',
    date: '2026-01-10',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HorseTreatmentService],
    });

    service = TestBed.inject(HorseTreatmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets all horse treatment links', () => {
    service.getAll().subscribe((data) => {
      expect(data).toEqual([link]);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('GET');
    req.flush([link]);
  });

  it('creates horse treatment link with POST body', () => {
    service.create(link).subscribe((data) => {
      expect(data).toEqual(link);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(link);
    req.flush(link);
  });
});
