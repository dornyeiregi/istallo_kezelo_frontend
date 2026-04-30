import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ItemService } from './item.service';
import { API_BASE_URL } from '../config';
import { ItemDTO } from '../models/item.model';

const API_URL = `${API_BASE_URL}/api/items`;

describe('ItemService', () => {
  let service: ItemService;
  let httpMock: HttpTestingController;

  const item: ItemDTO = {
    itemId: 1,
    name: 'Hay',
    itemType: 'FEED',
    itemCategory: 'CONSUMABLE',
    feedUnitAmount: 2,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ItemService],
    });

    service = TestBed.inject(ItemService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets all items', () => {
    service.getAll().subscribe((data) => {
      expect(data).toEqual([item]);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('GET');
    req.flush([item]);
  });

  it('gets item by id', () => {
    service.getItemById(1).subscribe((data) => {
      expect(data).toEqual(item);
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(item);
  });

  it('creates item with POST body', () => {
    service.create(item).subscribe((data) => {
      expect(data).toEqual(item);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(item);
    req.flush(item);
  });

  it('updates item as text response', () => {
    service.update(1, item).subscribe((data) => {
      expect(data).toBe('updated');
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(item);
    expect(req.request.responseType).toBe('text');
    req.flush('updated');
  });

  it('deletes item as text response', () => {
    service.delete(1).subscribe((data) => {
      expect(data).toBe('deleted');
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.responseType).toBe('text');
    req.flush('deleted');
  });
});
