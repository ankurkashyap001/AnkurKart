export interface CartItem {
  id: number;           // Backend se milne wala Cart Item ka unique ID
  product_id: number;   // Main product ka ID
  title: string;        // Product name
  primary_image: string;// Product image URL
  sale_price: number;   // Discounted / Current selling price
  price: number;        // MRP / Original price
  quantity: number;     // Cart mein kitni quantity added hai
  stock_limit: number;  // Max limit jo user add kar sakta hai
  unit?: string;        // e.g., '500 g', '1 kg', etc.

  // Optional Aliases for backend compatibility
  product_name?: string;
  image_url?: string;
  name?: string;
  product?: {
    id: number;
    name: string;
    title?: string;
    primary_image?: string;
    image_url?: string;
    price: number;
    sale_price: number;
  };
}

export interface Cart {
  items: CartItem[];    // Array of cart items
  subtotal: number;     // Items price subtotal
  delivery_fee: number; // Delivery charges (if any)
  total: number;        // Final pay amount
}