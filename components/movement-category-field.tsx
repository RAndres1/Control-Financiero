"use client";

import { useEffect, useMemo, useState } from "react";

import type { Category, MovementKind, OwnerType } from "@/lib/types";

type MovementCategoryFieldProps = {
  categories: Category[];
  defaultOwnerType: OwnerType;
  defaultKind: MovementKind;
  defaultCategoryId?: string;
};

export function MovementCategoryField({
  categories,
  defaultOwnerType,
  defaultKind,
  defaultCategoryId
}: MovementCategoryFieldProps) {
  const [ownerType, setOwnerType] = useState<OwnerType>(defaultOwnerType);
  const [kind, setKind] = useState<MovementKind>(defaultKind);
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? "");

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => category.owner_type === ownerType && category.kind === kind);
  }, [categories, ownerType, kind]);

  useEffect(() => {
    if (!filteredCategories.some((category) => category.id === categoryId)) {
      setCategoryId("");
    }
  }, [filteredCategories, categoryId]);

  return (
    <>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Tipo</label>
        <select name="kind" value={kind} onChange={(event) => setKind(event.target.value as MovementKind)}>
          <option value="expense">Gasto</option>
          <option value="income">Ingreso</option>
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Ambito</label>
        <select name="owner_type" value={ownerType} onChange={(event) => setOwnerType(event.target.value as OwnerType)}>
          <option value="personal">Personal</option>
          <option value="business">Negocio</option>
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Categoria</label>
        <select name="category_id" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required>
          <option value="">Selecciona una categoria</option>
          {filteredCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
