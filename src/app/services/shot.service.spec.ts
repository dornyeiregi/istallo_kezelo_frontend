import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ShotService } from './shot.service';
import { API_BASE_URL } from '../config';
import { ShotDTO } from '../models/shot.model';

const API_URL = `${API_BASE_URL}/api/shots`;

describe('ShotService', () => {
  let service: ShotService;
  let httpMock: HttpTestingController;

  const shot: ShotDTO = {
    shotId: 1,
    shotName: 'Tetanus',
    date: '2026-01-10',
    horseIds: [1],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ShotService],
    });

    service = TestBed.inject(ShotService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets all shots', () => {
    service.getAll().subscribe((data) => {
      expect(data).toEqual([shot]);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('GET');
    req.flush([shot]);
  });

  it('gets shots of horse by horse id', () => {
    service.getAllOfHorseById(2).subscribe((data) => {
      expect(data).toEqual([shot]);
    });

    const req = httpMock.expectOne(`${API_URL}/horseId/2`);
    expect(req.request.method).toBe('GET');
    req.flush([shot]);
  });

  it('gets shot by id', () => {
    service.getById(1).subscribe((data) => {
      expect(data).toEqual(shot);
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(shot);
  });

  it('creates shot with POST body', () => {
    service.create(shot).subscribe((data) => {
      expect(data).toEqual(shot);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(shot);
    req.flush(shot);
  });

  it('updates shot as text response', () => {
    service.update(1, shot).subscribe((data) => {
      expect(data).toBe('updated');
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(shot);
    expect(req.request.responseType).toBe('text');
    req.flush('updated');
  });

  it('deletes shot as text response', () => {
    service.delete(1).subscribe((data) => {
      expect(data).toBe('deleted');
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.responseType).toBe('text');
    req.flush('deleted');
  });
});
