import { useState, ReactNode } from "react";
import { toast } from "sonner";

export type AdminTabType = "news" | "quotes" | null;

export interface AdminConfig {
  fields: { name: string; type: string; placeholder: string }[];
  render: (item: any) => ReactNode;
}

export interface AdminPanelState {
  adminTab: AdminTabType;
  form: Record<string, any>;
  editingId: number | null;
}

export interface AdminPanelActions {
  setAdminTab: (tab: AdminTabType) => void;
  setForm: (form: Record<string, any>) => void;
  setEditingId: (id: number | null) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleEdit: (item: any) => void;
  handleDelete: (id?: number) => Promise<void>;
  resetForm: () => void;
}

export const useAdminPanel = (
  config: Record<string, AdminConfig>,
  getDataSource: (tab: AdminTabType) => { insert: (data: any) => Promise<any>; update: (id: number, data: any) => Promise<void>; remove: (id: number) => Promise<void> } | null,
  onSuccess?: () => void
): [AdminPanelState, AdminPanelActions] => {
  const [adminTab, setAdminTab] = useState<AdminTabType>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  const resetForm = () => {
    setForm({});
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataSource = getDataSource(adminTab);
    
    if (!adminTab || !dataSource) return;

    try {

      const { id, created_at, ...dataToSubmit } = form;
      
      if (editingId) {
        await dataSource.update(editingId, dataToSubmit);
        toast.success(`✅ ${adminTab === "news" ? "News" : "Quote"} updated!`);
      } else {
        await dataSource.insert(dataToSubmit);
        toast.success(`✅ ${adminTab === "news" ? "News" : "Quote"} added!`);
      }
      resetForm();
      onSuccess?.();
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleEdit = (item: any) => {
    setForm(item);
    setEditingId(item.id);
    toast.info("Editing...");
  };

  const handleDelete = async (id?: number) => {
    const dataSource = getDataSource(adminTab);
    
    if (!id || !adminTab || !dataSource) return;
    if (window.confirm("Delete this record?")) {
      try {
        await dataSource.remove(id);
        toast.success(`✅ ${adminTab === "news" ? "News" : "Quote"} deleted!`);
      } catch (err: any) {
        toast.error(`Error: ${err.message}`);
      }
    }
  };

  return [
    { adminTab, form, editingId },
    { setAdminTab, setForm, setEditingId, handleSubmit, handleEdit, handleDelete, resetForm },
  ];
};