import React, { useCallback, useEffect, useState } from "react";
import { Building2, ImagePlus, MapPin, Pencil, Plus, Power, Trash2, X } from "lucide-react";
import { baseUrl } from "../../../components/base/baseurl";
import { getUserData } from "../../../components/user/services/localStorageService";

const emptyForm = { name: "", code: "", address: "", phone: "", email: "", logo: null };

export default function SchoolManagementView() {
  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const token = getUserData()?.token;

  const loadSchools = useCallback(async () => {
    const response = await fetch(`${baseUrl}/api/schools`, { headers: { Authorization: `Bearer ${token}` } });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Unable to load schools");
    setSchools(payload.data || []);
  }, [token]);

  useEffect(() => { loadSchools().catch((err) => setError(err.message)); }, [loadSchools]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true); setError("");
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      // When editing, empty text fields must still be sent so they can be cleared.
      if (value || (editingId && key !== "logo")) body.append(key, value ?? "");
    });
    try {
      const response = await fetch(
        editingId ? `${baseUrl}/api/schools/${editingId}` : `${baseUrl}/api/schools`,
        { method: editingId ? "PATCH" : "POST", headers: { Authorization: `Bearer ${token}` }, body },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `Unable to ${editingId ? "update" : "create"} school`);
      cancelEdit();
      await loadSchools();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  const startEdit = (school) => {
    setError("");
    setEditingId(school.id);
    setForm({ name: school.name || "", code: school.code || "", address: school.address || "", phone: school.phone || "", email: school.email || "", logo: null });
    const input = document.getElementById("school-logo-input");
    if (input) input.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    const input = document.getElementById("school-logo-input");
    if (input) input.value = "";
  };

  const toggle = async (school) => {
    const body = new FormData(); body.append("isActive", String(!school.isActive));
    const response = await fetch(`${baseUrl}/api/schools/${school.id}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` }, body });
    if (response.ok) loadSchools();
  };

  const remove = async (school) => {
    if (!window.confirm(`Delete ${school.name}? This is only allowed when no user accounts are assigned.`)) return;
    const response = await fetch(`${baseUrl}/api/schools/${school.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    const payload = await response.json();
    if (!response.ok) return setError(payload.error || "Unable to delete school");
    loadSchools();
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-widest text-lime-600">CISD administration</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">Schools & campuses</h1>
          <p className="mt-2 text-slate-500">Create each campus once, upload its identity, then assign its Accounts and Admission logins from User Management.</p>
        </div>

        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

        <div className="grid gap-7 lg:grid-cols-[380px_1fr]">
          <form onSubmit={submit} className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-lime-100 p-3 text-lime-700"><Plus size={20}/></div><div><h2 className="font-extrabold text-slate-900">{editingId ? "Edit school" : "Create school"}</h2><p className="text-xs text-slate-500">{editingId ? "Upload a new logo only if you want to replace it" : "Name and logo are required"}</p></div>{editingId && <button type="button" onClick={cancelEdit} className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Cancel edit"><X size={18}/></button>}</div>
            <div className="space-y-4">
              <input required placeholder="School / campus name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-lime-500" />
              <input required placeholder="Short code (e.g. CISD-ISB)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-lime-500" />
              <input placeholder="Campus address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-lime-500" />
              <div className="grid grid-cols-2 gap-3"><input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-lime-500" /><input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-lime-500" /></div>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-600 hover:border-lime-400"><ImagePlus size={20}/><span>{form.logo?.name || (editingId ? "Replace logo (optional, PNG or JPG)" : "Upload school logo (PNG or JPG)")}</span><input id="school-logo-input" required={!editingId} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => setForm({ ...form, logo: e.target.files?.[0] || null })}/></label>
              <button disabled={saving} className="w-full rounded-xl bg-slate-900 px-4 py-3 font-bold text-white hover:bg-lime-600 disabled:opacity-60">{saving ? "Saving…" : editingId ? "Save changes" : "Create school"}</button>
            </div>
          </form>

          <section>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {schools.map((school) => (
                <article key={school.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex h-36 items-center justify-center bg-slate-100 p-5"><img src={school.logoUrl.startsWith("http") ? school.logoUrl : `${baseUrl}${school.logoUrl}`} alt={`${school.name} logo`} className="h-full w-full object-contain"/></div>
                  <div className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-extrabold text-slate-900">{school.name}</h3><p className="mt-1 text-xs font-bold uppercase tracking-wider text-lime-600">{school.code}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${school.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{school.isActive ? "ACTIVE" : "INACTIVE"}</span></div>
                    {school.address && <p className="mt-4 flex gap-2 text-xs text-slate-500"><MapPin size={14}/>{school.address}</p>}
                    <div className="mt-5 flex gap-2"><button onClick={() => startEdit(school)} className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Pencil size={14}/>Edit</button><button onClick={() => toggle(school)} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Power size={14}/>{school.isActive ? "Disable" : "Enable"}</button><button onClick={() => remove(school)} className="rounded-lg border border-red-100 px-3 py-2 text-red-600 hover:bg-red-50"><Trash2 size={14}/></button></div>
                  </div>
                </article>
              ))}
              {!schools.length && <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center text-slate-400"><Building2 className="mx-auto mb-3"/><p className="font-semibold">Create your first CISD campus.</p></div>}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
