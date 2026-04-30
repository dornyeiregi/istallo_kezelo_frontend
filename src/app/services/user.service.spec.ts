import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { API_BASE_URL } from '../config';
import { UserDTO } from '../models/user.model';

const API_URL = `${API_BASE_URL}/api/users`;

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const user: UserDTO = {
    userId: 1,
    username: 'anna',
    email: 'anna@example.com',
    phone: '123',
    userType: 'OWNER',
    userFname: 'Anna',
    userLname: 'Nagy',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService],
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets all users', () => {
    service.getAll().subscribe((data) => {
      expect(data).toEqual([user]);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('GET');
    req.flush([user]);
  });

  it('gets user by id', () => {
    service.getById(1).subscribe((data) => {
      expect(data).toEqual(user);
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(user);
  });

  it('gets user by username', () => {
    service.getByUsername('anna').subscribe((data) => {
      expect(data).toEqual(user);
    });

    const req = httpMock.expectOne(`${API_URL}/byUsername/anna`);
    expect(req.request.method).toBe('GET');
    req.flush(user);
  });

  it('creates user with POST body', () => {
    service.create(user).subscribe((data) => {
      expect(data).toEqual(user);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(user);
    req.flush(user);
  });

  it('updates user with PATCH body', () => {
    service.update(1, user).subscribe((data) => {
      expect(data).toEqual(user);
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(user);
    req.flush(user);
  });
});
