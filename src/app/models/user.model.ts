/**
 * User data returned by the backend for account and role management screens.
 */
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
  /**
   * Backend role enum assigned to the user.
   */
  userType: 'ADMIN' | 'OWNER' | 'EMPLOYEE';
  userId?: number;
}
