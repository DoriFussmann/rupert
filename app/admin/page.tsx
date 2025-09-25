"use client";
import { useEffect, useMemo, useState } from "react";

type User = { id:string; email:string; name:string|null; role:string; createdAt:string };
type Field = { id:string; label:string; key:string; type:string; required:boolean; order:number };
type RecordT = { id:string; data:any; createdAt:string };

function Section({ title, children }: { title:string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="mb-6 rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-lg font-medium">{title}</h2>
        <button className="text-sm underline" onClick={()=>setOpen(o=>!o)}>{open ? "Collapse" : "Expand"}</button>
      </header>
      {open && <div className="p-4">{children}</div>}
    </section>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={"w-full border rounded px-3 py-2 text-sm "+(props.className||"")} />;
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={"w-full border rounded px-3 py-2 text-sm "+(props.className||"")} />;
}
function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={"rounded px-3 py-2 text-sm border bg-black text-white disabled:opacity-60 "+(props.className||"")} />;
}

async function apiJson(url: string, init?: RequestInit) {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
  if (!res.ok && res.status !== 204) throw new Error((await res.json().catch(()=>({error:"Request failed"}))).error || "Request failed");
  return res.status === 204 ? null : res.json();
}

export default function AdminPage() {
  // USERS
  const [users, setUsers] = useState<User[]>([]);
  const [uEmail, setUEmail] = useState(""); const [uName, setUName] = useState(""); const [uRole, setURole] = useState("user"); const [uPass, setUPass] = useState("");

  // COLLECTIONS (Advisors / Structures)
  const [activeSlug, setActiveSlug] = useState<"advisors"|"structures">("advisors");
  const [fields, setFields] = useState<Field[]>([]);
  const [records, setRecords] = useState<RecordT[]>([]);
  const [rDraft, setRDraft] = useState<Record<string, any>>({});
  const [showFieldsEditor, setShowFieldsEditor] = useState(false);
  const [fDraft, setFDraft] = useState<{label:string; key:string; type:string; required:boolean; order:number}>({ label:"", key:"", type:"text", required:false, order:0 });

  // LOADERS
  async function loadUsers() {
    const data: User[] = await apiJson("/api/admin/users");
    setUsers(data);
  }
  async function loadCollection(slug: "advisors"|"structures") {
    const f: Field[] = await apiJson(`/api/collections/${slug}/fields`);
    setFields(f);
    const r: RecordT[] = await apiJson(`/api/collections/${slug}/records`);
    setRecords(r);
    // reset draft with empty values
    const draft: Record<string, any> = {};
    f.forEach(x => { draft[x.key] = ""; });
    setRDraft(draft);
  }

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => { loadCollection(activeSlug); }, [activeSlug]);

  // USERS: create
  async function createUser() {
    await apiJson("/api/admin/users", { method: "POST", body: JSON.stringify({ email: uEmail, name: uName || null, role: uRole, password: uPass }) });
    setUEmail(""); setUName(""); setURole("user"); setUPass("");
    await loadUsers();
  }
  async function deleteUser(id: string) {
    await apiJson(`/api/admin/users/${id}`, { method: "DELETE" });
    await loadUsers();
  }

  // FIELDS: create / update / delete
  async function addField() {
    await apiJson(`/api/collections/${activeSlug}/fields`, { method: "POST", body: JSON.stringify(fDraft) });
    setFDraft({ label:"", key:"", type:"text", required:false, order:0 });
    await loadCollection(activeSlug);
  }
  async function removeField(id: string) {
    await apiJson(`/api/collections/${activeSlug}/fields/${id}`, { method: "DELETE" });
    await loadCollection(activeSlug);
  }

  // RECORDS: create / delete / update
  async function addRecord() {
    await apiJson(`/api/collections/${activeSlug}/records`, { method: "POST", body: JSON.stringify({ data: rDraft }) });
    await loadCollection(activeSlug);
  }

  const fieldTypes = useMemo(()=>["text","number","image","json","date"], []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl mb-2">Admin</h1>

      <Section title="Users">
        <div className="grid md:grid-cols-3 gap-3">
          <TextInput placeholder="Email" value={uEmail} onChange={(e)=>setUEmail(e.target.value)} />
          <TextInput placeholder="Name (optional)" value={uName} onChange={(e)=>setUName(e.target.value)} />
          <Select value={uRole} onChange={(e)=>setURole(e.target.value)}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </Select>
          <TextInput placeholder="Temporary Password" type="password" value={uPass} onChange={(e)=>setUPass(e.target.value)} />
          <div className="md:col-span-3">
            <Button onClick={createUser} disabled={!uEmail || !uPass}>Add User</Button>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="text-left border-b">
              <th className="py-2 pr-4">Email</th><th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Role</th><th className="py-2 pr-4">Actions</th>
            </tr></thead>
            <tbody>
              {users.map(u=>(
                <tr key={u.id} className="border-b">
                  <td className="py-2 pr-4">{u.email}</td>
                  <td className="py-2 pr-4">{u.name ?? ""}</td>
                  <td className="py-2 pr-4">{u.role}</td>
                  <td className="py-2 pr-4"><button className="text-red-600 underline" onClick={()=>deleteUser(u.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Collections">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm text-slate-600">Active:</span>
          <Button onClick={()=>setActiveSlug("advisors")} className={activeSlug==="advisors" ? "" : "bg-slate-700"}>Advisors</Button>
          <Button onClick={()=>setActiveSlug("structures")} className={activeSlug==="structures" ? "" : "bg-slate-700"}>Structures</Button>
          <button className="text-sm underline ml-auto" onClick={()=>setShowFieldsEditor(s=>!s)}>{showFieldsEditor ? "Hide Fields" : "Modify Fields"}</button>
        </div>

        {showFieldsEditor && (
          <div className="mb-6 rounded border p-3">
            <h3 className="font-medium mb-2">Fields for "{activeSlug}"</h3>
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full text-sm">
                <thead><tr className="text-left border-b">
                  <th className="py-2 pr-4">Label</th><th className="py-2 pr-4">Key</th><th className="py-2 pr-4">Type</th><th className="py-2 pr-4">Required</th><th className="py-2 pr-4">Order</th><th className="py-2 pr-4">Actions</th>
                </tr></thead>
                <tbody>
                  {fields.map(f=>(
                    <tr key={f.id} className="border-b">
                      <td className="py-2 pr-4">{f.label}</td>
                      <td className="py-2 pr-4">{f.key}</td>
                      <td className="py-2 pr-4">{f.type}</td>
                      <td className="py-2 pr-4">{f.required ? "Yes" : "No"}</td>
                      <td className="py-2 pr-4">{f.order}</td>
                      <td className="py-2 pr-4"><button className="text-red-600 underline" onClick={()=>removeField(f.id)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid md:grid-cols-5 gap-2 items-end">
              <TextInput placeholder="Label" value={fDraft.label} onChange={e=>setFDraft({...fDraft, label:e.target.value})} />
              <TextInput placeholder="key" value={fDraft.key} onChange={e=>setFDraft({...fDraft, key:e.target.value})} />
              <Select value={fDraft.type} onChange={e=>setFDraft({...fDraft, type:e.target.value})}>
                {fieldTypes.map(t=><option key={t} value={t}>{t}</option>)}
              </Select>
              <Select value={String(fDraft.required)} onChange={e=>setFDraft({...fDraft, required: e.target.value==="true"})}>
                <option value="false">required: false</option>
                <option value="true">required: true</option>
              </Select>
              <TextInput placeholder="order" value={String(fDraft.order)} onChange={e=>setFDraft({...fDraft, order: Number(e.target.value)||0})} />
              <div className="md:col-span-5"><Button onClick={addField} disabled={!fDraft.label || !fDraft.key}>Add Field</Button></div>
            </div>
          </div>
        )}

        <div className="rounded border p-3">
          <h3 className="font-medium mb-3">Records — {activeSlug}</h3>
          <div className="grid md:grid-cols-3 gap-2 mb-3">
            {fields.map(f => (
              <TextInput key={f.id} placeholder={f.label} value={rDraft[f.key] ?? ""} onChange={e=>setRDraft({ ...rDraft, [f.key]: e.target.value })} />
            ))}
            <div className="md:col-span-3">
              <Button onClick={addRecord}>Add Record</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead><tr className="text-left border-b">
                {fields.map(f => <th key={f.id} className="py-2 pr-4">{f.label}</th>)}
                <th className="py-2 pr-4">Created</th>
              </tr></thead>
              <tbody>
                {records.map(r=>(
                  <tr key={r.id} className="border-b">
                    {fields.map(f => <td key={f.id} className="py-2 pr-4">{String(r.data?.[f.key] ?? "")}</td>)}
                    <td className="py-2 pr-4">{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>
    </div>
  );
}
