export interface SalesCategory {
    category_id: string;
    category_name: string;
    max_discount: string;
    category_logo_url_web: string | null;
    category_logo_url: string | null;
    category_banner_url?: string | null;
    prescription_required?: string;
    cat_desc?: string | null;
    category_description?: string | null;
    parent_id?: string | null;
  }
  
  export interface ApiResponse<T> {
    success: boolean;
    message: string;
    code: number;
    data: T;
  }
  
  export interface CategoryDataResponse {
    sales_category: SalesCategory[];
    order_via_whatsapp?: string;
  }