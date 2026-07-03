"use client";

import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { money } from "@/lib/format";
import {
  ItemInput,
  useCreateCategory,
  useDeleteCategory,
  useSaveItem,
  useVendorCategories,
  useVendorItems,
} from "@/lib/hooks/use-vendor-admin";
import { toast } from "@/lib/toast-store";
import type { MenuItem } from "@/lib/types";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

export default function VendorMenuPage() {
  const categories = useVendorCategories();
  const items = useVendorItems();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const { create, update, remove, toggle } = useSaveItem();

  const [newCat, setNewCat] = useState("");
  const [editing, setEditing] = useState<MenuItem | "new" | null>(null);

  const itemList = items.data?.pages.flatMap((p) => p.data) ?? [];
  const cats = categories.data ?? [];

  const addCategory = async () => {
    if (!newCat.trim()) return;
    try {
      await createCategory.mutateAsync({ name: newCat.trim() });
      setNewCat("");
      toast.success("Category added");
    } catch {
      toast.error("Could not add category.");
    }
  };

  const saveItem = async (input: ItemInput, id?: number) => {
    try {
      if (id) await update.mutateAsync({ id, body: input });
      else await create.mutateAsync(input);
      setEditing(null);
      toast.success(id ? "Item updated" : "Item added");
    } catch {
      toast.error("Could not save item.");
    }
  };

  return (
    <>
      <PageHeader title="Menu" subtitle="Manage categories and items" />

      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-6">
        {/* Categories */}
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {cats.map((cat) => (
              <span key={cat.id} className="flex items-center gap-2 rounded-full border border-line bg-bg-soft px-3 py-1 text-sm">
                {cat.name}
                <button onClick={() => deleteCategory.mutate(cat.id)} aria-label="Delete category" className="text-muted hover:text-danger">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category name" className="max-w-xs" />
            <Button variant="secondary" onClick={addCategory} loading={createCategory.isPending}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </section>

        {/* Items */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted">Items</h2>
            <Button size="sm" onClick={() => setEditing("new")}>
              <Plus className="h-4 w-4" /> Add item
            </Button>
          </div>

          {editing === "new" && (
            <ItemForm categories={cats} onCancel={() => setEditing(null)} onSave={(input) => saveItem(input)} saving={create.isPending} />
          )}

          {items.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 rounded-card" />
              <Skeleton className="h-16 rounded-card" />
            </div>
          ) : items.isError ? (
            <ErrorState message="Couldn't load items. Are you a vendor?" onRetry={() => items.refetch()} />
          ) : itemList.length === 0 && editing !== "new" ? (
            <EmptyState title="No items yet" hint="Add your first menu item." />
          ) : (
            <div className="space-y-2">
              {itemList.map((item) =>
                editing && editing !== "new" && editing.id === item.id ? (
                  <ItemForm
                    key={item.id}
                    item={item}
                    categories={cats}
                    onCancel={() => setEditing(null)}
                    onSave={(input) => saveItem(input, item.id)}
                    saving={update.isPending}
                  />
                ) : (
                  <div key={item.id} className="flex items-center gap-3 rounded-card border border-line bg-bg-soft p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="text-xs text-muted">{money(item.price)}</p>
                    </div>
                    <button
                      onClick={() => toggle.mutate(item.id)}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${item.is_available ? "bg-success/15 text-success" : "bg-surface text-muted"}`}
                    >
                      {item.is_available ? "Available" : "Hidden"}
                    </button>
                    <button onClick={() => setEditing(item)} aria-label="Edit" className="text-muted hover:text-content">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove.mutate(item.id)} aria-label="Delete" className="text-muted hover:text-danger">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function ItemForm({
  item,
  categories,
  onSave,
  onCancel,
  saving,
}: {
  item?: MenuItem;
  categories: { id: number; name: string }[];
  onSave: (input: ItemInput) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [price, setPrice] = useState(item?.price != null ? String(item.price) : "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [categoryId, setCategoryId] = useState<string>(item?.category_id ? String(item.category_id) : "");
  const [variants, setVariants] = useState<{ name: string; price_modifier: string }[]>(
    item?.variants?.map((v) => ({ name: v.name, price_modifier: String(v.price_modifier) })) ?? [],
  );
  const [addons, setAddons] = useState<{ name: string; price: string }[]>(
    item?.addons?.map((a) => ({ name: a.name, price: String(a.price) })) ?? [],
  );
  const [image, setImage] = useState<string | null>(item?.images?.[0] ?? null);

  const submit = () => {
    const p = parseFloat(price);
    if (!name.trim() || Number.isNaN(p) || p < 0) {
      toast.error("Enter a name and a valid price.");
      return;
    }
    onSave({
      name: name.trim(),
      price: p,
      description: description.trim() || undefined,
      category_id: categoryId ? Number(categoryId) : null,
      variants: variants.filter((v) => v.name.trim()).map((v) => ({ name: v.name.trim(), price_modifier: parseFloat(v.price_modifier) || 0 })),
      addons: addons.filter((a) => a.name.trim()).map((a) => ({ name: a.name.trim(), price: parseFloat(a.price) || 0 })),
      images: image ? [image] : [],
    });
  };

  return (
    <div className="mb-2 space-y-3 rounded-card border border-brand/40 bg-bg-soft p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Margherita Pizza" />
        <Input label="Price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="299" />
      </div>
      <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-muted">Photo</label>
        <ImageUpload value={image} onChange={setImage} category="menu" label="Upload photo" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-muted">Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="h-10 rounded-lg border border-line bg-bg-soft px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
        >
          <option value="">Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      {/* Variants */}
      <RowEditor
        label="Variants (e.g. Small / Large)"
        rows={variants}
        cols={[
          { key: "name", placeholder: "Name", flex: true },
          { key: "price_modifier", placeholder: "+/- price", type: "number" },
        ]}
        onAdd={() => setVariants((v) => [...v, { name: "", price_modifier: "0" }])}
        onChange={(i, key, val) => setVariants((v) => v.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)))}
        onRemove={(i) => setVariants((v) => v.filter((_, idx) => idx !== i))}
      />

      {/* Add-ons */}
      <RowEditor
        label="Add-ons (e.g. Extra cheese)"
        rows={addons}
        cols={[
          { key: "name", placeholder: "Name", flex: true },
          { key: "price", placeholder: "Price", type: "number" },
        ]}
        onAdd={() => setAddons((a) => [...a, { name: "", price: "0" }])}
        onChange={(i, key, val) => setAddons((a) => a.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)))}
        onRemove={(i) => setAddons((a) => a.filter((_, idx) => idx !== i))}
      />

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={submit} loading={saving}>Save item</Button>
      </div>
    </div>
  );
}

function RowEditor({
  label,
  rows,
  cols,
  onAdd,
  onChange,
  onRemove,
}: {
  label: string;
  rows: Record<string, string>[];
  cols: { key: string; placeholder: string; type?: string; flex?: boolean }[];
  onAdd: () => void;
  onChange: (index: number, key: string, value: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted">{label}</label>
        <button type="button" onClick={onAdd} className="text-xs text-brand hover:underline">+ Add</button>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          {cols.map((c) => (
            <input
              key={c.key}
              type={c.type ?? "text"}
              value={row[c.key]}
              placeholder={c.placeholder}
              onChange={(e) => onChange(i, c.key, e.target.value)}
              className={`h-9 rounded-lg border border-line bg-bg px-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60 ${c.flex ? "flex-1" : "w-28"}`}
            />
          ))}
          <button type="button" onClick={() => onRemove(i)} className="text-muted hover:text-danger" aria-label="Remove">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
