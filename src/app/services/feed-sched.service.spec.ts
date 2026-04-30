import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FeedSchedService } from './feed-sched.service';
import { API_BASE_URL } from '../config';
import { FeedSchedDTO } from '../models/feed-sched.model';
import { FeedSchedChangeRequestDTO } from '../models/feed-sched-change-request.model';

const API_URL = `${API_BASE_URL}/api/feedScheds`;

describe('FeedSchedService', () => {
  let service: FeedSchedService;
  let httpMock: HttpTestingController;

  const feedSched: FeedSchedDTO = {
    feedSchedId: 1,
    feedMorning: true,
    feedNoon: false,
    feedEvening: true,
    description: 'Morning and evening',
    horseIds: [1],
    itemIds: [2],
  };

  const changeRequest: FeedSchedChangeRequestDTO = {
    id: 3,
    feedSchedId: 1,
    description: 'Change request',
    horseIds: [1],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FeedSchedService],
    });

    service = TestBed.inject(FeedSchedService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets all feed schedules', () => {
    service.getAll().subscribe((data) => {
      expect(data).toEqual([feedSched]);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('GET');
    req.flush([feedSched]);
  });

  it('gets feed schedule by id', () => {
    service.getById(1).subscribe((data) => {
      expect(data).toEqual(feedSched);
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(feedSched);
  });

  it('gets feed schedules of horse by horse id', () => {
    service.getAllOfHorseById(2).subscribe((data) => {
      expect(data).toEqual([feedSched]);
    });

    const req = httpMock.expectOne(`${API_URL}/horseId/2`);
    expect(req.request.method).toBe('GET');
    req.flush([feedSched]);
  });

  it('creates feed schedule as text response', () => {
    service.create(feedSched).subscribe((data) => {
      expect(data).toBe('created');
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(feedSched);
    expect(req.request.responseType).toBe('text');
    req.flush('created');
  });

  it('updates feed schedule as text response', () => {
    service.update(1, feedSched).subscribe((data) => {
      expect(data).toBe('updated');
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(feedSched);
    expect(req.request.responseType).toBe('text');
    req.flush('updated');
  });

  it('deletes feed schedule as text response', () => {
    service.delete(1).subscribe((data) => {
      expect(data).toBe('deleted');
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.responseType).toBe('text');
    req.flush('deleted');
  });

  it('gets all change requests', () => {
    service.getChangeRequests().subscribe((data) => {
      expect(data).toEqual([changeRequest]);
    });

    const req = httpMock.expectOne(`${API_URL}/requests`);
    expect(req.request.method).toBe('GET');
    req.flush([changeRequest]);
  });

  it('gets own change requests', () => {
    service.getMyChangeRequests().subscribe((data) => {
      expect(data).toEqual([changeRequest]);
    });

    const req = httpMock.expectOne(`${API_URL}/requests/mine`);
    expect(req.request.method).toBe('GET');
    req.flush([changeRequest]);
  });

  it('approves change request as text response', () => {
    service.approveChangeRequest(3).subscribe((data) => {
      expect(data).toBe('approved');
    });

    const req = httpMock.expectOne(`${API_URL}/requests/3/approve`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    expect(req.request.responseType).toBe('text');
    req.flush('approved');
  });

  it('rejects change request as text response', () => {
    service.rejectChangeRequest(3).subscribe((data) => {
      expect(data).toBe('rejected');
    });

    const req = httpMock.expectOne(`${API_URL}/requests/3`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.responseType).toBe('text');
    req.flush('rejected');
  });
});
