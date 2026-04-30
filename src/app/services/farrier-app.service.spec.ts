import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FarrierAppService } from './farrier-app.service';
import { API_BASE_URL } from '../config';
import { FarrierAppDTO } from '../models/farrier-app.model';

const API_URL = `${API_BASE_URL}/api/farrierApps`;

describe('FarrierAppService', () => {
  let service: FarrierAppService;
  let httpMock: HttpTestingController;

  const farrierApp: FarrierAppDTO = {
    farrierAppId: 1,
    farrierName: 'John Farrier',
    farrierPhone: '123',
    appointmentDate: '2026-01-10',
    horseIds: [1],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FarrierAppService],
    });

    service = TestBed.inject(FarrierAppService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets all farrier appointments', () => {
    service.getAll().subscribe((data) => {
      expect(data).toEqual([farrierApp]);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('GET');
    req.flush([farrierApp]);
  });

  it('gets farrier appointment by id', () => {
    service.getById(1).subscribe((data) => {
      expect(data).toEqual(farrierApp);
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(farrierApp);
  });

  it('gets farrier appointments of horse by horse id', () => {
    service.getAllOfHorseById(2).subscribe((data) => {
      expect(data).toEqual([farrierApp]);
    });

    const req = httpMock.expectOne(`${API_URL}/horseId/2`);
    expect(req.request.method).toBe('GET');
    req.flush([farrierApp]);
  });

  it('creates farrier appointment with POST body', () => {
    service.create(farrierApp).subscribe((data) => {
      expect(data).toEqual(farrierApp);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(farrierApp);
    req.flush(farrierApp);
  });

  it('updates farrier appointment as text response', () => {
    service.update(1, farrierApp).subscribe((data) => {
      expect(data).toBe('updated');
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(farrierApp);
    expect(req.request.responseType).toBe('text');
    req.flush('updated');
  });

  it('deletes farrier appointment as text response', () => {
    service.delete(1).subscribe((data) => {
      expect(data).toBe('deleted');
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.responseType).toBe('text');
    req.flush('deleted');
  });
});
