export interface Address {
    id?: number;
    full_name: string;
    phone: string;
    address_line: string;
    city: string;
    state: string;
    postal_code: string;
    is_default?: boolean;
  }