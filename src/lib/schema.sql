-- Supabase Database Schema for Everyday Shoes
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop tables in correct order (reverse foreign key dependency)
drop table if exists supplier_payments;
drop table if exists sale_items;
drop table if exists sales;
drop table if exists products;
drop table if exists customers;
drop table if exists suppliers;

-- Suppliers table
create table suppliers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  contact_name text,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Products table
create table products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  brand text,
  category text,
  color text,
  size text,
  sku text unique,
  cost_price numeric(10,2) default 0,
  selling_price numeric(10,2) not null,
  stock_quantity integer default 0,
  low_stock_threshold integer default 10,
  supplier_id uuid references suppliers(id) on delete set null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Customers table
create table customers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text,
  phone text,
  address text,
  notes text,
  total_purchases integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sales table
create table sales (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references customers(id) on delete set null,
  total_amount numeric(10,2) not null,
  payment_method text default 'cash',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sale Items table (KEY FIX: on delete cascade)
create table sale_items (
  id uuid default uuid_generate_v4() primary key,
  sale_id uuid references sales(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade,
  quantity integer not null,
  unit_price numeric(10,2) not null,
  subtotal numeric(10,2) not null
);

-- Supplier Payments table
create table supplier_payments (
  id uuid default uuid_generate_v4() primary key,
  supplier_id uuid references suppliers(id) on delete cascade not null,
  amount numeric(10,2) not null,
  due_date date,
  notes text,
  paid boolean default false,
  paid_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index idx_products_supplier on products(supplier_id);
create index idx_products_sku on products(sku);
create index idx_products_stock on products(stock_quantity);
create index idx_sales_created on sales(created_at);
create index idx_sale_items_sale on sale_items(sale_id);
create index idx_sale_items_product on sale_items(product_id);
create index idx_customers_phone on customers(phone);
create index idx_supplier_payments_supplier on supplier_payments(supplier_id);
create index idx_supplier_payments_due_date on supplier_payments(due_date);
create index idx_supplier_payments_paid on supplier_payments(paid);

-- Row Level Security (RLS)
alter table suppliers enable row level security;
alter table products enable row level security;
alter table customers enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table supplier_payments enable row level security;

-- RLS Policies (drop first to avoid conflicts)
drop policy if exists "Allow all for suppliers" on suppliers;
create policy "Allow all for suppliers" on suppliers for all using (true);
drop policy if exists "Allow all for products" on products;
create policy "Allow all for products" on products for all using (true);
drop policy if exists "Allow all for customers" on customers;
create policy "Allow all for customers" on customers for all using (true);
drop policy if exists "Allow all for sales" on sales;
create policy "Allow all for sales" on sales for all using (true);
drop policy if exists "Allow all for sale_items" on sale_items;
create policy "Allow all for sale_items" on sale_items for all using (true);
drop policy if exists "Allow all for supplier_payments" on supplier_payments;
create policy "Allow all for supplier_payments" on supplier_payments for all using (true);

-- Function to update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers
drop trigger if exists update_suppliers_updated_at on suppliers;
create trigger update_suppliers_updated_at before update on suppliers for each row execute function update_updated_at();

drop trigger if exists update_products_updated_at on products;
create trigger update_products_updated_at before update on products for each row execute function update_updated_at();

drop trigger if exists update_customers_updated_at on customers;
create trigger update_customers_updated_at before update on customers for each row execute function update_updated_at();

drop trigger if exists update_supplier_payments_updated_at on supplier_payments;
create trigger update_supplier_payments_updated_at before update on supplier_payments for each row execute function update_updated_at();