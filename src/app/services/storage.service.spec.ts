import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StorageService } from './storage.service';
import { API_BASE_URL } from '../config';
import { StorageDTO } from '../models/storage.model';

const API_URL = `${API_BASE_URL}/api/storages`;

describe('StorageService', () => {
  let service: StorageService;
  let httpMock: HttpTestingController;

  const storage: StorageDTO = {
    storageId: 1,
    amountInUse: 2,
    amountStored: 10,
    itemId: 3,
    itemName: 'Hay',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StorageService],
    });

    service = TestBed.inject(StorageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets all storages', () => {
    service.getAll().subscribe((data) => {
      expect(data).toEqual([storage]);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('GET');
    req.flush([storage]);
  });

  it('gets storage alerts', () => {
    service.getAlerts().subscribe((data) => {
      expect(data).toEqual([storage]);
    });

    const req = httpMock.expectOne(`${API_URL}/alerts`);
    expect(req.request.method).toBe('GET');
    req.flush([storage]);
  });

  it('creates storage with POST body', () => {
    service.create(storage).subscribe((data) => {
      expect(data).toEqual(storage);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(storage);
    req.flush(storage);
  });

  it('updates storage as text response', () => {
    service.update(1, storage).subscribe((data) => {
      expect(data).toBe('updated');
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(storage);
    expect(req.request.responseType).toBe('text');
    req.flush('updated');
  });

  it('deletes storage as text response', () => {
    service.delete(1).subscribe((data) => {
      expect(data).toBe('deleted');
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.responseType).toBe('text');
    req.flush('deleted');
  });
});
