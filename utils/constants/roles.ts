export const DRIVER_ROLE = 'driver';
export const CUSTOMER_ADMIN_ROLE = 'customerAdmin';
export const GLOBAL_ADMIN_ROLE = 'globalAdmin';
export const CUSTOMER_ACCOUNTANT_ROLE = 'customerAccountant';
export const EMPLOYER_ROLE = 'employer';
export const CUSTOMER_ROLE = 'customer';

export const CONTACT_PERSON_ROLES = [
    CUSTOMER_ADMIN_ROLE, GLOBAL_ADMIN_ROLE, CUSTOMER_ACCOUNTANT_ROLE, CUSTOMER_ROLE, EMPLOYER_ROLE,
];

export const ALL_ROLES = [DRIVER_ROLE, ...CONTACT_PERSON_ROLES];