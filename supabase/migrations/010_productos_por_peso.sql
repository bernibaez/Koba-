-- Migration: Add weight-based sales support to products table
-- Compatible with unit sales, scale barcodes, and decimal inventory tracking.

ALTER TABLE IF EXISTS public.productos 
  ADD COLUMN IF NOT EXISTS sale_type text DEFAULT 'unit' CHECK (sale_type IN ('unit', 'weight', 'both')),
  ADD COLUMN IF NOT EXISTS weight_unit text DEFAULT 'lb' CHECK (weight_unit IN ('lb', 'kg', 'g', 'oz')),
  ADD COLUMN IF NOT EXISTS price_per_weight numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS allow_decimal boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS min_weight numeric DEFAULT 0.01,
  ADD COLUMN IF NOT EXISTS max_weight numeric DEFAULT 999.99,
  ADD COLUMN IF NOT EXISTS generate_scale_barcode boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_weight_product boolean DEFAULT false;

-- Create index for scale barcode lookups
CREATE INDEX IF NOT EXISTS idx_productos_sale_type ON public.productos(sale_type);
CREATE INDEX IF NOT EXISTS idx_productos_is_weight ON public.productos(is_weight_product);
