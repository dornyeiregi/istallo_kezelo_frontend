import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HorseFeedSchedService } from './horse-feed-sched.service';
import { API_BASE_URL } from '../config';
import { HorseFeedSchedDTO } from '../models/horse-feed-sched.model';

const API_URL = `${API_BASE_URL}/api/horseFeedScheds`;

describe('HorseFeedSchedService', () => {
  let service: HorseFeedSchedService;
  let httpMock: HttpTestingController;

  const link: HorseFeedSchedDTO = {
    horseId: 1,
    feedSchedId: 2,
    horseName: 'Star',
    feedDescription: 'Morning',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HorseFeedSchedService],
    });

    service = TestBed.inject(HorseFeedSchedService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets all horse feed schedule links', () => {
    service.getAll().subscribe((data) => {
      expect(data).toEqual([link]);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('GET');
    req.flush([link]);
  });

  it('gets horse feed schedule link by id', () => {
    service.getById(1).subscribe((data) => {
      expect(data).toEqual(link);
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(link);
  });

  it('gets horse feed schedules by horse id', () => {
    service.getAllOfHorseById(3).subscribe((data) => {
      expect(data).toEqual([link]);
    });

    const req = httpMock.expectOne(`${API_URL}/horseId/3`);
    expect(req.request.method).toBe('GET');
    req.flush([link]);
  });

  it('creates horse feed schedule link with POST body', () => {
    service.create(link).subscribe((data) => {
      expect(data).toEqual(link);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(link);
    req.flush(link);
  });

  it('deletes all links for horse as text response', () => {
    service.deleteAllForHorse(3).subscribe((data) => {
      expect(data).toBe('deleted');
    });

    const req = httpMock.expectOne(`${API_URL}/horseId/3`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.responseType).toBe('text');
    req.flush('deleted');
  });
});
