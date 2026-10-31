import {
  Car,
  CircleEllipsis,
  CirclePlus,
  Coffee,
  Gift,
  HeartPulse,
  Receipt,
  ShoppingBag,
  Utensils,
  Wallet,
  ArrowLeftRight,
  Scale,
  type LucideIcon,
} from 'lucide-react';

/** Nama ikon di tabel categories.icon → komponen lucide. */
const MAP: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  receipt: Receipt,
  'shopping-bag': ShoppingBag,
  coffee: Coffee,
  'heart-pulse': HeartPulse,
  'circle-ellipsis': CircleEllipsis,
  wallet: Wallet,
  gift: Gift,
  'circle-plus': CirclePlus,
  transfer: ArrowLeftRight,
  adjustment: Scale,
};

export default function CatIcon({
  icon,
  color,
  size = 18,
  className = '',
}: {
  icon: string | null;
  color: string | null;
  size?: number;
  className?: string;
}) {
  const Icon = (icon && MAP[icon]) || CircleEllipsis;
  return (
    <Icon
      size={size}
      strokeWidth={1.8}
      aria-hidden
      className={className}
      color={color ?? '#9CA3AF'}
    />
  );
}
