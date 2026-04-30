import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FeedSchedItemService } from './feed-sched-item.service';
import { API_BASE_URL } from '../config';
import { FeedSchedItemDTO } from '../models/feed-sched-item.model';

const API_URL = `${API_BASE_URL}/api/feedSchedItems`;

describe('FeedSchedItemService', () => {
  let service: FeedSchedItemService;
  let httpMock: HttpTestingController;

  const item: FeedSchedItemDTO = {
    feedSchedId: 1,
    itemId: 2,
    itemName: 'Hay',
    feedDescription: 'Morning',
    amount: 2,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FeedSchedItemService],
    });

    service = TestBed.inject(FeedSchedItemService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets all feed schedule items', () => {
    service.getAll().subscribe((data) => {
      expect(data).toEqual([item]);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('GET');
    req.flush([item]);
  });

  it('creates feed schedule item with POST body', () => {
    service.create(item).subscribe((data) => {
      expect(data).toEqual(item);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(item);
    req.flush(item);
  });
});
