export interface UserDTO {
  username: string;
  userLname: string;
  userFname: string;
  email: string;
  phone?: string;
  userType: 'ADMIN' | 'OWNER' | 'EMPLOYEE'; // Enum backendről
  userId?: number;
}
