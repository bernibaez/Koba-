import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Product } from './ProductManagementScreen';
import { Package, Printer, Sparkles } from 'lucide-react';
import { generateUniqueBarcode } from '@/lib/barcodeUtils';
import { logAuditEvent } from '@/lib/auditStore';
import { toast } from 'sonner';
import WeightProductForm, { type WeightFormState } from '@/components/weight/WeightProductForm';
import type { SaleType, WeightUnit } from '@/types/database';

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: (p: Product) => void;
  onPrintLabel?: (p: Product) => void;
}

type FormValues = Omit<Product, 'id' | 'stockStatus'>;

const categories = ['Granos', 'Lácteos', 'Carnes', 'Bebidas', 'Limpieza', 'Panadería', 'Frutas', 'Snacks'];
const brands = ['Molinos Modernos', 'Mazola', 'Pollo Rey', 'Carnation', 'Central Romana', 'Goya', 'Del Valle', 'Fabuloso', 'Chobani', 'Otra'];
const units = ['Unidad', 'Libra', 'Kilogramo', 'Litro', 'Cartón', 'Paquete', 'Caja', 'Bolsa'];
const suppliers = ['Distribuidora El Caribe', 'Importadora Pérez', 'Nestlé Dominicana', 'Pollo Rey SRL', 'Central Romana Corp.', 'Avícola Rondón SRL', 'Lechería Macoris SA', 'Colgate-Palmolive DO', 'Panadería La Fe'];
const taxOptions = [0, 18];

function FormField({
  label,
  name,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-semibold text-foreground">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

export default function ProductFormModal({ open, onClose, product, onSave, onPrintLabel }: ProductFormModalProps) {
  const isEdit = !!product;

  const [weightState, setWeightState] = useState<WeightFormState>({
    saleType: 'unit',
    weightUnit: 'lb',
    pricePerWeight: 0,
    minWeight: 0.01,
    maxWeight: 999.99,
    allowDecimal: true,
    generateScaleBarcode: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      barcode: '',
      sku: '',
      name: '',
      category: 'Granos',
      brand: 'Molinos Modernos',
      unit: 'Unidad',
      supplier: 'Distribuidora El Caribe',
      costPrice: 0,
      salePrice: 0,
      wholesalePrice: 0,
      tax: 0,
      minStock: 10,
      currentStock: 0,
      image: '',
      expiryDate: null,
      warranty: 'N/A',
      status: 'active',
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        barcode: product.barcode,
        sku: product.sku,
        name: product.name,
        category: product.category,
        brand: product.brand,
        unit: product.unit,
        supplier: product.supplier,
        costPrice: product.costPrice,
        salePrice: product.salePrice,
        wholesalePrice: product.wholesalePrice,
        tax: product.tax,
        minStock: product.minStock,
        currentStock: product.currentStock,
        image: product.image,
        expiryDate: product.expiryDate,
        warranty: product.warranty,
        status: product.status,
      });
      setWeightState({
        saleType: product.saleType ?? (product.isWeightProduct ? 'weight' : 'unit'),
        weightUnit: product.weightUnit ?? 'lb',
        pricePerWeight: product.pricePerWeight ?? product.salePrice ?? 0,
        minWeight: product.minWeight ?? 0.01,
        maxWeight: product.maxWeight ?? 999.99,
        allowDecimal: product.allowDecimal ?? true,
        generateScaleBarcode: product.generateScaleBarcode ?? false,
      });
    } else {
      reset({
        barcode: '',
        sku: '',
        name: '',
        category: 'Granos',
        brand: 'Molinos Modernos',
        unit: 'Unidad',
        supplier: 'Distribuidora El Caribe',
        costPrice: 0,
        salePrice: 0,
        wholesalePrice: 0,
        tax: 0,
        minStock: 10,
        currentStock: 0,
        image: '',
        expiryDate: null,
        warranty: 'N/A',
        status: 'active',
      });
      setWeightState({
        saleType: 'unit',
        weightUnit: 'lb',
        pricePerWeight: 0,
        minWeight: 0.01,
        maxWeight: 999.99,
        allowDecimal: true,
        generateScaleBarcode: false,
      });
    }
  }, [product, reset, open]);

  const handleGenerateBarcode = () => {
    const code = generateUniqueBarcode();
    setValue('barcode', code, { shouldValidate: true, shouldDirty: true });
    toast.success(`Código de barras único generado: ${code}`);
  };

  const onSubmit = (data: FormValues) => {
    const cost = Number(data.costPrice);
    const sale = Number(data.salePrice);
    const stock = isEdit && product ? product.currentStock : Number(data.currentStock);
    const minStk = Number(data.minStock);

    const stockStatus: Product['stockStatus'] =
      stock === 0 ? 'out' : stock < minStk ? 'low' : 'normal';

    const isWeight = weightState.saleType === 'weight' || weightState.saleType === 'both';

    const saved: Product = {
      id: product?.id ?? `prod-${Date.now()}`,
      ...data,
      unit: isWeight ? (weightState.weightUnit === 'kg' ? 'Kilogramo' : weightState.weightUnit === 'lb' ? 'Libra' : data.unit) : data.unit,
      costPrice: cost,
      salePrice: sale,
      wholesalePrice: Number(data.wholesalePrice),
      tax: Number(data.tax),
      minStock: minStk,
      currentStock: stock,
      stockStatus,
      saleType: weightState.saleType,
      weightUnit: weightState.weightUnit,
      pricePerWeight: sale,
      minWeight: weightState.minWeight,
      maxWeight: weightState.maxWeight,
      allowDecimal: weightState.allowDecimal,
      generateScaleBarcode: weightState.generateScaleBarcode,
      isWeightProduct: isWeight,
    };

    // System Audit Event
    if (isEdit && product) {
      const priceChanged = product.salePrice !== sale;
      logAuditEvent({
        user: 'Admin General',
        role: 'Administrador',
        action: priceChanged ? 'Cambio de precio' : 'Edición de producto',
        module: 'Gestión de Productos',
        details: priceChanged
          ? `Precio cambiado para "${saved.name}" de RD$ ${product.salePrice} a RD$ ${sale}`
          : `Producto "${saved.name}" actualizado`,
        before: { name: product.name, salePrice: product.salePrice, costPrice: product.costPrice },
        after: { name: saved.name, salePrice: saved.salePrice, costPrice: saved.costPrice },
      });
    } else {
      logAuditEvent({
        user: 'Admin General',
        role: 'Administrador',
        action: 'Edición de producto',
        module: 'Gestión de Productos',
        details: `Nuevo producto creado: "${saved.name}" (SKU: ${saved.sku})`,
        after: { name: saved.name, sku: saved.sku, salePrice: saved.salePrice },
      });
    }

    onSave(saved);
  };

  const costPrice = watch('costPrice');
  const salePrice = watch('salePrice');
  const margin = costPrice && salePrice && Number(costPrice) > 0
    ? (((Number(salePrice) - Number(costPrice)) / Number(salePrice)) * 100).toFixed(1)
    : '0.0';

  const isWeighted = weightState.saleType === 'weight' || weightState.saleType === 'both';
  const weightUnitShort = weightState.weightUnit ? weightState.weightUnit.toUpperCase() : 'LB';

  if (!open) return null;

  return (
    <div className="space-y-6 slide-up">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEdit ? `Editar: ${product?.name}` : 'Nuevo Producto'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isEdit ? `SKU: ${product?.sku}` : 'Completa todos los campos requeridos'}
          </p>
        </div>
        <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
          ← Volver a Productos
        </button>
      </div>

      <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="card p-5 sm:p-6 space-y-6">
        {/* Basic Info */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package size={14} className="text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Información Básica</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Nombre del Producto" name="name" error={errors.name?.message} required>
              <input
                id="name"
                {...register('name', { required: 'El nombre es obligatorio', minLength: { value: 3, message: 'Mínimo 3 caracteres' } })}
                className="input-field"
                placeholder="Ej: Arroz Selecto 5lb"
              />
            </FormField>

            <FormField label="SKU" name="sku" error={errors.sku?.message} required hint="Código único interno del producto">
              <input
                id="sku"
                {...register('sku', { required: 'El SKU es obligatorio' })}
                className="input-field font-mono"
                placeholder="Ej: ARR-SEL-5LB"
              />
            </FormField>

            <FormField label="Código de Barras" name="barcode" error={errors.barcode?.message} hint="EAN-13, Code-128 o auto-generado">
              <div className="flex gap-2">
                <input
                  id="barcode"
                  {...register('barcode')}
                  className="input-field font-mono flex-1"
                  placeholder="Ej: 7891000100103"
                />
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="btn-secondary text-xs flex items-center gap-1 px-3 whitespace-nowrap"
                  title="Generar código de barras único automáticamente"
                >
                  <Sparkles size={14} className="text-primary" /> Generar Código
                </button>
              </div>
            </FormField>

            <FormField label="Categoría" name="category" error={errors.category?.message} required>
              <select id="category" {...register('category', { required: true })} className="input-field">
                {categories.map((c) => (
                  <option key={`cat-opt-${c}`} value={c}>{c}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Marca" name="brand" error={errors.brand?.message} required>
              <select id="brand" {...register('brand', { required: true })} className="input-field">
                {brands.map((b) => (
                  <option key={`brand-opt-${b}`} value={b}>{b}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Unidad de Medida" name="unit" error={errors.unit?.message} required>
              <select id="unit" {...register('unit', { required: true })} className="input-field">
                {units.map((u) => (
                  <option key={`unit-opt-${u}`} value={u}>{u}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Proveedor" name="supplier" error={errors.supplier?.message} required>
              <select id="supplier" {...register('supplier', { required: true })} className="input-field">
                {suppliers.map((s) => (
                  <option key={`sup-opt-${s}`} value={s}>{s}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Estado" name="status" error={errors.status?.message} required>
              <select id="status" {...register('status', { required: true })} className="input-field">
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="discontinued">Descontinuado</option>
              </select>
            </FormField>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Section: Tipo de Venta (Peso / Unidad) */}
        <WeightProductForm
          values={weightState}
          onChange={(updates) => setWeightState((prev) => ({ ...prev, ...updates }))}
          baseSalePrice={Number(salePrice || 0)}
        />

        <div className="border-t border-border" />

        {/* Pricing */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-success-bg flex items-center justify-center">
                <span className="text-success text-xs font-bold">$</span>
              </div>
              <h3 className="text-sm font-semibold text-foreground">Precios e Impuestos</h3>
            </div>
            {Number(costPrice) > 0 && Number(salePrice) > 0 && (
              <div className="flex items-center gap-1.5 bg-success-bg px-2.5 py-1 rounded-lg">
                <span className="text-xs text-muted-foreground">Margen:</span>
                <span className="text-xs font-bold text-success tabular-nums">{margin}%</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={isWeighted ? `Precio de Compra por ${weightUnitShort} (RD$)` : "Precio de Compra (RD$)"} name="costPrice" error={errors.costPrice?.message} required>
              <input
                id="costPrice"
                type="number"
                step="0.01"
                min={0}
                {...register('costPrice', {
                  required: 'El precio de compra es obligatorio',
                  min: { value: 0, message: 'Debe ser mayor o igual a 0' },
                })}
                className="input-field tabular-nums"
                placeholder="0.00"
              />
            </FormField>

            <FormField label={isWeighted ? `Precio de Venta por ${weightUnitShort} (RD$)` : "Precio de Venta (RD$)"} name="salePrice" error={errors.salePrice?.message} required>
              <input
                id="salePrice"
                type="number"
                step="0.01"
                min={0}
                {...register('salePrice', {
                  required: 'El precio de venta es obligatorio',
                  min: { value: 0, message: 'Debe ser mayor o igual a 0' },
                })}
                className="input-field tabular-nums"
                placeholder="0.00"
              />
            </FormField>

            <FormField
              label={isWeighted ? `Precio Mayorista por ${weightUnitShort} (RD$)` : "Precio Mayorista (RD$)"}
              name="wholesalePrice"
              error={errors.wholesalePrice?.message}
              hint={isWeighted ? `Precio por ${weightUnitShort} para compras al por mayor` : "Precio para compras al por mayor"}
            >
              <input
                id="wholesalePrice"
                type="number"
                step="0.01"
                min={0}
                {...register('wholesalePrice', {
                  min: { value: 0, message: 'Debe ser mayor o igual a 0' },
                })}
                className="input-field tabular-nums"
                placeholder="0.00"
              />
            </FormField>

            <FormField label="ITBIS (%)" name="tax" error={errors.tax?.message} hint="Impuesto sobre Transferencia de Bienes Industrializados">
              <select id="tax" {...register('tax')} className="input-field">
                {taxOptions.map((t) => (
                  <option key={`tax-opt-${t}`} value={t}>{t === 0 ? 'Exento (0%)' : `${t}%`}</option>
                ))}
              </select>
            </FormField>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Inventory */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-info-bg flex items-center justify-center">
              <Package size={14} className="text-info" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Inventario y Vencimiento</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label={isWeighted ? `Stock Actual (${weightUnitShort})` : "Stock Actual"}
              name="currentStock"
              error={errors.currentStock?.message}
              required={!isEdit}
              hint={isEdit ? 'No editable aquí — usa Ajustes de Stock para cambiar existencias' : (isWeighted ? `Cantidad de ${weightUnitShort} actualmente en inventario` : 'Cantidad actual en inventario')}
            >
              <input
                id="currentStock"
                type="number"
                min={0}
                disabled={isEdit}
                {...register('currentStock', {
                  required: isEdit ? false : 'El stock actual es obligatorio',
                  min: { value: 0, message: 'No puede ser negativo' },
                })}
                className={`input-field tabular-nums ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                placeholder="0"
              />
            </FormField>

            <FormField
              label={isWeighted ? `Stock Mínimo (${weightUnitShort})` : "Stock Mínimo"}
              name="minStock"
              error={errors.minStock?.message}
              required
              hint={isWeighted ? `Alerta cuando las ${weightUnitShort} bajen de este nivel` : "Alerta cuando el stock baje de este nivel"}
            >
              <input
                id="minStock"
                type="number"
                min={0}
                {...register('minStock', {
                  required: 'El stock mínimo es obligatorio',
                  min: { value: 0, message: 'No puede ser negativo' },
                })}
                className="input-field tabular-nums"
                placeholder="10"
              />
            </FormField>

            <FormField
              label="Fecha de Vencimiento"
              name="expiryDate"
              error={errors.expiryDate?.message}
              hint="Dejar vacío si el producto no tiene vencimiento"
            >
              <input
                id="expiryDate"
                type="date"
                {...register('expiryDate')}
                className="input-field"
              />
            </FormField>

            <FormField
              label="Garantía"
              name="warranty"
              error={errors.warranty?.message}
              hint="Período de garantía del producto"
            >
              <input
                id="warranty"
                {...register('warranty')}
                className="input-field"
                placeholder="Ej: 6 meses, 1 año, N/A"
              />
            </FormField>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border">
          <div className="flex items-center gap-2 flex-wrap">
            {isEdit && product && onPrintLabel && (
              <button
                type="button"
                onClick={() => onPrintLabel(product)}
                className="btn-secondary text-xs flex items-center gap-1.5 py-1.5"
              >
                <Printer size={14} /> Imprimir Etiqueta
              </button>
            )}
            <p className="text-xs text-muted-foreground">
              Los campos con <span className="text-danger">*</span> son obligatorios
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-2 min-w-28 justify-center"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>{isEdit ? 'Guardar Cambios' : 'Crear Producto'}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}