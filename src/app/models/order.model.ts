export interface OrderPayload {
    address_id: number;
    payment_method: 'COD' | 'Online';
  }
  
  export interface OrderResponse {
    id: number;
    order_number: string;
    total_amount: number;
    status: string;
    payment_method: string;
    payment_status: string;
    created_at: string;
  }