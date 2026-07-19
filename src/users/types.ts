export type LearnerProfile = {
  username: string; // links to the User account with the same username

  // Identity section
  firstName: string;
  surname: string;
  email: string;
  mobile: string;
  idNumber: string;
  currentOccupation: string;
  futureOccupations: string;

  // Assignment section
  languagePreference: string;
  department: string;
};
