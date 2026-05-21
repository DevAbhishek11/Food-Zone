import { money } from "@/lib/format";
import type { Vendor } from "@/lib/types";
import { Star, Clock, MapPin } from "lucide-react";
import Link from "next/link";

export function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <Link
      href={`/vendors/${vendor.slug}`}
      className="group flex flex-col overflow-hidden rounded-card border border-line bg-bg-soft transition-colors hover:border-brand/50"
    >
      <div className="relative h-32 w-full bg-surface">
        {vendor.banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vendor.banner} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl font-bold text-line">
            {vendor.name.charAt(0)}
          </div>
        )}
        {!vendor.is_open && (
          <span className="absolute right-2 top-2 rounded-full bg-danger/90 px-2 py-0.5 text-xs font-medium text-white">
            Closed
          </span>
        )}
        {vendor.is_featured && (
          <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-xs font-medium text-white">
            Featured
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="truncate font-semibold group-hover:text-brand">{vendor.name}</h3>
        {vendor.description && (
          <p className="line-clamp-1 text-xs text-muted">{vendor.description}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted">
          <span className="flex items-center gap-1 text-warning">
            <Star className="h-3.5 w-3.5 fill-current" />
            {vendor.rating_avg > 0 ? vendor.rating_avg.toFixed(1) : "New"}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {vendor.prep_time_minutes} min
          </span>
          {vendor.city && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {vendor.city}
            </span>
          )}
          <span>
            {vendor.delivery_fee > 0 ? `${money(vendor.delivery_fee)} delivery` : "Free delivery"}
          </span>
        </div>
      </div>
    </Link>
  );
}
