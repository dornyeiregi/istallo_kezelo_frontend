import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminService } from './admin.service';
import { API_BASE_URL } from '../config';
import { UserDTO } from '../models/user.model';

const API_URL = `${API_BASE_URL}/api/admin`;

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  const user: UserDTO = {
    userId: 1,
    username: 'admin',
    email: 'admin@example.com',
    userType: 'ADMIN',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminService],
    });

    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets all users', () => {
    service.getAllUsers().subscribe((data) => {
      expect(data).toEqual([user]);
    });

    const req = httpMock.expectOne(`${API_URL}/users`);
    expect(req.request.method).toBe('GET');
    req.flush([user]);
  });

  it('updates user role as text response', () => {
    service.updateUserRole(1, 'OWNER').subscribe((data) => {
      expect(data).toBe('updated');
    });

    const req = httpMock.expectOne(`${API_URL}/update-role/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ userType: 'OWNER' });
    expect(req.request.responseType).toBe('text');
    req.flush('updated');
  });

  it('deletes user as text response', () => {
    service.deleteUser(1).subscribe((data) => {
      expect(data).toBe('deleted');
    });

    const req = httpMock.expectOne(`${API_URL}/users/1`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.responseType).toBe('text');
    req.flush('deleted');
  });

  it('creates user as text response', () => {
    const payload = {
      username: 'new-user',
      email: 'new@example.com',
      userType: 'OWNER',
    };

    service.createUser(payload).subscribe((data) => {
      expect(data).toBe('created');
    });

    const req = httpMock.expectOne(`${API_URL}/users`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    expect(req.request.responseType).toBe('text');
    req.flush('created');
  });
});
