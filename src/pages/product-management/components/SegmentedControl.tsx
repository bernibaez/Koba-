import SegmentedControl, { type SegmentOption as UiSegmentOption } from '@/components/ui/SegmentedControl';

export type QuickView = 'all' | 'low_stock' | 'scale' | 'inactive';

export type SegmentOption<T extends string = QuickView> = UiSegmentOption<T>;

export * from '@/components/ui/SegmentedControl';
export default SegmentedControl;
