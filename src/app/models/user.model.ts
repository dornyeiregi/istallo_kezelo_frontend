export interface UserDTO {
  username: string;
  userLname?: string;
  userFname?: string;
  lName?: string;
  fName?: string;
  lastName?: string;
  firstName?: string;
  fullName?: string;
  f_name?: string;
  l_name?: string;
  user_fname?: string;
  user_lname?: string;
  email: string;
  phone?: string;
  userType: 'ADMIN' | 'OWNER' | 'EMPLOYEE'; // Enum backendről
  userId?: number;
}
