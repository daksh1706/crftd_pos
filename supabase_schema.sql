-- Supabase PostgreSQL Schema for CRFTD POS

-- 1. Users Table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'Cashier' CHECK (role IN ('Admin', 'Manager', 'Cashier')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Customers Table
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0.0,
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ingredients Table
CREATE TABLE ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  unit TEXT NOT NULL,
  current_stock NUMERIC DEFAULT 0,
  low_stock_threshold NUMERIC DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Ingredient Recipes (Self-referential for complex ingredients)
CREATE TABLE ingredient_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  child_ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL
);

-- 5. Menu Items Table
CREATE TABLE menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  image TEXT DEFAULT '',
  prep_instructions TEXT DEFAULT '',
  description TEXT DEFAULT '',
  calories NUMERIC,
  protein NUMERIC,
  carbs NUMERIC,
  fat NUMERIC,
  is_available BOOLEAN DEFAULT true,
  is_customization BOOLEAN DEFAULT false,
  customization_type TEXT DEFAULT 'None' CHECK (customization_type IN ('Base', 'Flavour', 'Topping', 'Filling', 'Syrup', 'None')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Menu Item Recipes (Mapping Menu Items to Ingredients)
CREATE TABLE menu_item_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL
);

-- 7. Orders Table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  order_number INTEGER NOT NULL,
  subtotal NUMERIC NOT NULL,
  tax_amount NUMERIC NOT NULL,
  discount_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'UPI', 'Card', 'Stripe')),
  cash_given NUMERIC DEFAULT 0,
  change_due NUMERIC DEFAULT 0,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  cashier_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Preparing' CHECK (status IN ('Pending Payment', 'Preparing', 'Ready', 'Completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Order Items Table
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_time NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL
);

-- 9. Order Item Customizations
CREATE TABLE order_item_customizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  name TEXT,
  price NUMERIC
);

-- 10. Loyalty Settings Table (singleton row, id = 1)
CREATE TABLE loyalty_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  points_per_order INTEGER DEFAULT 1,
  threshold_points INTEGER DEFAULT 10,
  reward_type TEXT DEFAULT 'discount' CHECK (reward_type IN ('discount', 'freeItem')),
  reward_value TEXT DEFAULT '10',
  reward_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert the default loyalty settings row
INSERT INTO loyalty_settings (id, points_per_order, threshold_points, reward_type, reward_value)
VALUES (1, 1, 10, 'discount', '10')
ON CONFLICT (id) DO NOTHING;
