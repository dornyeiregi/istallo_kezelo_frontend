import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HorseShotService } from './horse-shot.service';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/horseShots`;

describe('HorseShotService', () => {
  let service: HorseShotService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HorseShotService],
    });

    service = TestBed.inject(HorseShotService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('adds shot to horse with POST body', () => {
    const response = { ok: true };

    service.addShotToHorse(2, 3).subscribe((data) => {
      expect(data).toEqual(response);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ shotId: 2, horseId: 3 });
    req.flush(response);
  });
});
