"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import StructureEditor from "./collections/[slug]/records/[id]/StructureEditor";

type User = { id:string; email:string; name:string|null; role:string; createdAt:string };
type Field = { id:string; label:string; key:string; type:string; required:boolean; order:number };
type RecordT = { id:string; data:Record<string, unknown>; createdAt:string };

function Section({ title, children }: { title:string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="nb-card mb-6">
      <header className="nb-card-header">
        <button 
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 text-left w-full hover:text-gray-600 transition-colors"
        >
          <svg 
            className={`w-4 h-4 transform transition-transform ${open ? 'rotate-90' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h2 className="nb-card-title">{title}</h2>
        </button>
      </header>
      {open && <div className="nb-card-body">{children}</div>}
    </section>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={"nb-input "+(props.className||"")} />;
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={"nb-select "+(props.className||"")} />;
}
function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={"nb-btn nb-btn-primary "+(props.className||"")} />;
}

async function apiJson(url: string, init?: RequestInit) {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
  if (!res.ok && res.status !== 204) throw new Error((await res.json().catch(()=>({error:"Request failed"}))).error || "Request failed");
  return res.status === 204 ? null : res.json();
}

export default function AdminPage() {
  const router = useRouter();
  
  // USERS
  const [users, setUsers] = useState<User[]>([]);
  const [uEmail, setUEmail] = useState(""); const [uName, setUName] = useState(""); const [uRole, setURole] = useState("user"); const [uPass, setUPass] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // COLLECTIONS
  // ADVISORS COLLECTION
  const [advisorFields, setAdvisorFields] = useState<Field[]>([]);
  const [advisorRecords, setAdvisorRecords] = useState<RecordT[]>([]);
  const [advisorRDraft, setAdvisorRDraft] = useState<Record<string, unknown>>({});
  const [advisorFDraft, setAdvisorFDraft] = useState<{label:string; key:string; type:string; required:boolean; order:number}>({ label:"", key:"", type:"text", required:false, order:0 });

  // STRUCTURES COLLECTION
  const [structureFields, setStructureFields] = useState<Field[]>([]);
  const [structureRecords, setStructureRecords] = useState<RecordT[]>([]);
  const [structureRDraft, setStructureRDraft] = useState<Record<string, unknown>>({});
  const [structureFDraft, setStructureFDraft] = useState<{label:string; key:string; type:string; required:boolean; order:number}>({ label:"", key:"", type:"text", required:false, order:0 });
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);

  async function loadUsers() { setUsers(await apiJson("/api/admin/users")); }
  
  async function loadAdvisors() {
    const f: Field[] = await apiJson(`/api/collections/advisors/fields`);
    setAdvisorFields(f);
    const r: RecordT[] = await apiJson(`/api/collections/advisors/records`);
    setAdvisorRecords(r);
    const draft: Record<string, unknown> = {};
    f.forEach(x => { draft[x.key] = ""; });
    setAdvisorRDraft(draft);
  }

  async function loadStructures() {
    const f: Field[] = await apiJson(`/api/collections/structures/fields`);
    setStructureFields(f);
    const r: RecordT[] = await apiJson(`/api/collections/structures/records`);
    setStructureRecords(r);
    const draft: Record<string, unknown> = {};
    f.forEach(x => { draft[x.key] = ""; });
    setStructureRDraft(draft);
  }

  useEffect(() => { 
    loadUsers(); 
    loadAdvisors();
    loadStructures();
  }, []);

  async function createUser() {
    await apiJson("/api/admin/users", { method: "POST", body: JSON.stringify({ email: uEmail, name: uName || null, role: uRole, password: uPass }) });
    setUEmail(""); setUName(""); setURole("user"); setUPass(""); await loadUsers();
  }
  async function deleteUser(id: string) { await apiJson(`/api/admin/users/${id}`, { method: "DELETE" }); await loadUsers(); }

  async function addField() {
    await apiJson(`/api/collections/${activeSlug}/fields`, { method: "POST", body: JSON.stringify(fDraft) });
    setFDraft({ label:"", key:"", type:"text", required:false, order:0 }); await loadCollection(activeSlug);
  }
  async function removeField(id: string) { await apiJson(`/api/collections/${activeSlug}/fields/${id}`, { method: "DELETE" }); await loadCollection(activeSlug); }

  async function addRecord() { await apiJson(`/api/collections/${activeSlug}/records`, { method: "POST", body: JSON.stringify({ data: rDraft }) }); await loadCollection(activeSlug); }

  const fieldTypes = useMemo(()=>["text","number","image","json","date"], []);

  return (
    <div className="space-y-6">

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
          <table className="nb-table">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="nb-th">Email</th>
                <th className="nb-th">Name</th>
                <th className="nb-th">Role</th>
                <th className="nb-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u=>(
                <tr 
                  key={u.id} 
                  onClick={() => setSelectedUser(u)}
                  className="border-b border-slate-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="nb-td">{u.email}</td>
                  <td className="nb-td">{u.name ?? "No name"}</td>
                  <td className="nb-td"><span className="nb-badge">{u.role}</span></td>
                  <td className="nb-td">
                    <button 
                      className="text-red-600 underline hover:text-red-800 transition-colors" 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteUser(u.id);
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Advisors">
        <div className="grid md:grid-cols-3 gap-2 mb-3">
          {advisorFields.map(f => (
            <TextInput key={f.id} placeholder={f.label} value={advisorRDraft[f.key] ?? ""} onChange={e=>setAdvisorRDraft({ ...advisorRDraft, [f.key]: e.target.value })} />
          ))}
          <div className="md:col-span-3">
            <button className="nb-btn nb-btn-primary" onClick={async () => {
              await apiJson(`/api/collections/advisors/records`, { method: "POST", body: JSON.stringify({ data: advisorRDraft }) });
              await loadAdvisors();
            }}>Add Advisor</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="nb-table">
            <thead>
              <tr className="border-b border-slate-200">
                {advisorFields.map(f => <th key={f.id} className="nb-th">{f.label}</th>)}
                <th className="nb-th">Created</th>
              </tr>
            </thead>
            <tbody>
              {advisorRecords.map(r=>(
                <tr key={r.id} className="border-b border-slate-100">
                  {advisorFields.map(f => <td key={f.id} className="nb-td">{String(r.data?.[f.key] ?? "")}</td>)}
                  <td className="nb-td">{new Date(r.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Structures">
        <div className="grid md:grid-cols-3 gap-2 mb-3">
          {structureFields.map(f => (
            <TextInput key={f.id} placeholder={f.label} value={structureRDraft[f.key] ?? ""} onChange={e=>setStructureRDraft({ ...structureRDraft, [f.key]: e.target.value })} />
          ))}
          <div className="md:col-span-3">
            <button className="nb-btn nb-btn-primary" onClick={async () => {
              const newRecord = await apiJson(`/api/collections/structures/records`, { method: "POST", body: JSON.stringify({ data: structureRDraft }) });
              setEditingStructureId(newRecord.id);
            }}>Add Structure</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="nb-table">
            <thead>
              <tr className="border-b border-slate-200">
                {structureFields.map(f => <th key={f.id} className="nb-th">{f.label}</th>)}
                <th className="nb-th">Created</th>
              </tr>
            </thead>
            <tbody>
              {structureRecords.map(r=>(
                <tr 
                  key={r.id} 
                  onClick={() => setEditingStructureId(r.id)}
                  className="border-b border-slate-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  {structureFields.map(f => <td key={f.id} className="nb-td">{String(r.data?.[f.key] ?? "")}</td>)}
                  <td className="nb-td">{new Date(r.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* User Details Modal */}
      {selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          zIndex: 50
        }}>
          <div style={{
            width: '100%',
            maxWidth: '896px',
            aspectRatio: '16/9',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)'
          }}>
            <div className="p-6 h-full flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-normal">User Details</h3>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* User Details Content */}
              <div className="flex-1 grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{selectedUser.email}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{selectedUser.name || "No name provided"}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      <span className="nb-badge">{selectedUser.role}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                    <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      {new Date(selectedUser.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Structure Editor Modal */}
      {editingStructureId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          zIndex: 60
        }}>
          <div style={{
            width: '95vw',
            height: '90vh',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Close Button */}
            <button 
              onClick={() => {
                setEditingStructureId(null);
                loadStructures(); // Refresh the structures list
              }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                zIndex: 10,
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer'
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Structure Editor */}
            <StructureEditor recordId={editingStructureId} />
          </div>
        </div>
      )}
    </div>
  );
}