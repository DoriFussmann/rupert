"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import StructureEditor from "./collections/[slug]/records/[id]/StructureEditor";

type User = { id:string; email:string; name:string|null; role:string; company:string|null; createdAt:string; pageAccess?:Record<string, boolean> };
type Field = { id:string; label:string; key:string; type:string; required:boolean; order:number };
type RecordT = { id:string; data:Record<string, unknown>; createdAt:string };

function Section({ title, children, defaultOpen = false }: { title:string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
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
  const [uEmail, setUEmail] = useState(""); const [uName, setUName] = useState(""); const [uRole, setURole] = useState("user"); const [uCompany, setUCompany] = useState(""); const [uPass, setUPass] = useState("");
  const [uPageAccess, setUPageAccess] = useState({
    home: true,
    admin: true,
    login: true,
    structures: true,
    advisors: true
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState(false);
  const [editUserData, setEditUserData] = useState<{name: string; role: string; company: string; pageAccess: Record<string, boolean>}>({
    name: "",
    role: "user",
    company: "",
    pageAccess: { home: true, admin: true, login: true, structures: true, advisors: true }
  });

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

  // COMPANIES COLLECTION
  const [companyFields, setCompanyFields] = useState<Field[]>([]);
  const [companyRecords, setCompanyRecords] = useState<RecordT[]>([]);
  const [companyRDraft, setCompanyRDraft] = useState<Record<string, unknown>>({});
  const [companyFDraft, setCompanyFDraft] = useState<{label:string; key:string; type:string; required:boolean; order:number}>({ label:"", key:"", type:"text", required:false, order:0 });

  // TASKS COLLECTION
  const [taskFields, setTaskFields] = useState<Field[]>([]);
  const [taskRecords, setTaskRecords] = useState<RecordT[]>([]);
  const [taskRDraft, setTaskRDraft] = useState<Record<string, unknown>>({});
  const [taskFDraft, setTaskFDraft] = useState<{label:string; key:string; type:string; required:boolean; order:number}>({ label:"", key:"", type:"text", required:false, order:0 });

  // MODAL STATES
  const [selectedAdvisor, setSelectedAdvisor] = useState<RecordT | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<RecordT | null>(null);
  const [selectedTask, setSelectedTask] = useState<RecordT | null>(null);
  const [editingAdvisor, setEditingAdvisor] = useState(false);
  const [editingCompany, setEditingCompany] = useState(false);
  const [editingTask, setEditingTask] = useState(false);
  const [editAdvisorData, setEditAdvisorData] = useState<Record<string, unknown>>({});
  const [editCompanyData, setEditCompanyData] = useState<Record<string, unknown>>({});
  const [editTaskData, setEditTaskData] = useState<Record<string, unknown>>({});

  // COMPANIES LIST FOR DROPDOWN
  const [companiesList, setCompaniesList] = useState<{id: string; name: string}[]>([]);
  
  // DROPDOWN STATES
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showModalRoleDropdown, setShowModalRoleDropdown] = useState(false);
  const [showModalCompanyDropdown, setShowModalCompanyDropdown] = useState(false);

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

  async function loadCompanies() {
    const f: Field[] = await apiJson(`/api/collections/companies/fields`);
    setCompanyFields(f);
    const r: RecordT[] = await apiJson(`/api/collections/companies/records`);
    setCompanyRecords(r);
    const draft: Record<string, unknown> = {};
    f.forEach(x => { draft[x.key] = ""; });
    setCompanyRDraft(draft);
  }

  async function loadCompaniesList() {
    const records: RecordT[] = await apiJson(`/api/collections/companies/records`);
    const companies = records.map(r => ({
      id: r.id,
      name: String(r.data?.name || "Unnamed Company")
    }));
    setCompaniesList(companies);
  }

  async function loadTasks() {
    const f: Field[] = await apiJson(`/api/collections/tasks/fields`);
    setTaskFields(f);
    const r: RecordT[] = await apiJson(`/api/collections/tasks/records`);
    setTaskRecords(r);
    const draft: Record<string, unknown> = {};
    f.forEach(x => { draft[x.key] = ""; });
    setTaskRDraft(draft);
  }

  useEffect(() => { 
    loadUsers(); 
    loadAdvisors();
    loadStructures();
    loadCompanies();
    loadTasks();
    loadCompaniesList();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      if (!target.closest('.relative.group')) {
        setShowRoleDropdown(false);
        setShowCompanyDropdown(false);
        setShowModalRoleDropdown(false);
        setShowModalCompanyDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function createUser() {
    await apiJson("/api/admin/users", { method: "POST", body: JSON.stringify({ 
      email: uEmail, 
      name: uName || null, 
      role: uRole, 
      company: uCompany || null,
      password: uPass, 
      pageAccess: uPageAccess 
    }) });
    setUEmail(""); setUName(""); setURole("user"); setUCompany(""); setUPass(""); 
    setUPageAccess({ home: true, admin: true, login: true, structures: true, advisors: true });
    await loadUsers();
  }
  async function deleteUser(id: string) { await apiJson(`/api/admin/users/${id}`, { method: "DELETE" }); await loadUsers(); }

  function startEditingUser(user: User) {
    setEditUserData({
      name: user.name || "",
      role: user.role,
      company: user.company || "",
      pageAccess: user.pageAccess || { home: true, admin: true, login: true, structures: true, advisors: true }
    });
    setEditingUser(true);
  }

  async function saveUserEdit() {
    if (!selectedUser) return;
    await apiJson(`/api/admin/users/${selectedUser.id}`, { 
      method: "PUT", 
      body: JSON.stringify(editUserData) 
    });
    setEditingUser(false);
    await loadUsers();
    // Update selectedUser with new data
    setSelectedUser({
      ...selectedUser,
      name: editUserData.name || null,
      role: editUserData.role,
      company: editUserData.company || null,
      pageAccess: editUserData.pageAccess
    });
  }

  function cancelUserEdit() {
    setEditingUser(false);
  }

  // STRUCTURES: delete record
  async function deleteStructureRecord(id: string) {
    if (confirm("Are you sure you want to delete this structure?")) {
      await apiJson(`/api/collections/structures/records/${id}`, { method: "DELETE" });
      await loadStructures();
    }
  }

  async function addField() {
    await apiJson(`/api/collections/${activeSlug}/fields`, { method: "POST", body: JSON.stringify(fDraft) });
    setFDraft({ label:"", key:"", type:"text", required:false, order:0 }); await loadCollection(activeSlug);
  }
  async function removeField(id: string) { await apiJson(`/api/collections/${activeSlug}/fields/${id}`, { method: "DELETE" }); await loadCollection(activeSlug); }

  async function addRecord() { await apiJson(`/api/collections/${activeSlug}/records`, { method: "POST", body: JSON.stringify({ data: rDraft }) }); await loadCollection(activeSlug); }

  const fieldTypes = useMemo(()=>["text","number","image","json","date"], []);

  return (
    <div className="space-y-6">

      <Section title="Users" defaultOpen={true}>
        <div className="grid md:grid-cols-3 gap-3">
          <TextInput placeholder="Email" value={uEmail} onChange={(e)=>setUEmail(e.target.value)} />
          <TextInput placeholder="Name (optional)" value={uName} onChange={(e)=>setUName(e.target.value)} />
            <div className="relative group">
              <button 
                type="button"
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:border-gray-400 transition-all text-left"
              >
                <svg className={`w-4 h-4 transform transition-transform ${showRoleDropdown ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span>{uRole === 'user' ? 'User' : 'Admin'}</span>
              </button>
              
              {showRoleDropdown && (
                <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    <button
                      type="button"
                      onClick={() => { setURole('user'); setShowRoleDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      User
                    </button>
                    <button
                      type="button"
                      onClick={() => { setURole('admin'); setShowRoleDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      Admin
                    </button>
                  </div>
                </div>
              )}
            </div>
          <div className="relative group">
            <button 
              type="button"
              onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:border-gray-400 transition-all text-left"
            >
              <svg className={`w-4 h-4 transform transition-transform ${showCompanyDropdown ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>{uCompany || "Select Company (optional)"}</span>
            </button>
            
            {showCompanyDropdown && (
              <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="py-2">
                  <button
                    type="button"
                    onClick={() => { setUCompany(""); setShowCompanyDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    No Company
                  </button>
                  {companiesList.map(company => (
                    <button
                      key={company.id}
                      type="button"
                      onClick={() => { setUCompany(company.name); setShowCompanyDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      {company.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <TextInput placeholder="Temporary Password" type="password" value={uPass} onChange={(e)=>setUPass(e.target.value)} />
          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-2">Page Access</label>
            <div className="flex flex-wrap gap-4">
              {Object.entries(uPageAccess).map(([page, checked]) => (
                <label key={page} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setUPageAccess(prev => ({ ...prev, [page]: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm capitalize">{page}</span>
                </label>
              ))}
            </div>
          </div>
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
                <th className="nb-th">Company</th>
                <th className="nb-th">Page Access</th>
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
                  <td className="nb-td"><span className="nb-badge">{u.role === 'user' ? 'User' : 'Admin'}</span></td>
                  <td className="nb-td">{u.company || "No company"}</td>
                  <td className="nb-td">
                    <div className="flex flex-wrap gap-1">
                      {u.pageAccess ? Object.entries(u.pageAccess).filter(([_, hasAccess]) => hasAccess).map(([page]) => (
                        <span key={page} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded capitalize">
                          {page}
                        </span>
                      )) : <span className="text-xs text-gray-500">All pages</span>}
                    </div>
                  </td>
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
                <tr 
                  key={r.id} 
                  onClick={() => setSelectedAdvisor(r)}
                  className="border-b border-slate-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
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
                       <th className="nb-th">Actions</th>
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
                     <td className="nb-td">
                       <button 
                         className="text-red-600 underline hover:text-red-800" 
                         onClick={(e) => {
                           e.stopPropagation(); // Prevent row click from opening editor
                           deleteStructureRecord(r.id);
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

      <Section title="Companies">
        <div className="grid md:grid-cols-3 gap-2 mb-3">
          {companyFields.map(f => (
            <TextInput key={f.id} placeholder={f.label} value={companyRDraft[f.key] ?? ""} onChange={e=>setCompanyRDraft({ ...companyRDraft, [f.key]: e.target.value })} />
          ))}
          <div className="md:col-span-3">
            <button className="nb-btn nb-btn-primary" onClick={async () => {
              await apiJson(`/api/collections/companies/records`, { method: "POST", body: JSON.stringify({ data: companyRDraft }) });
              await loadCompanies();
            }}>Add Company</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="nb-table">
            <thead>
              <tr className="border-b border-slate-200">
                {companyFields.map(f => <th key={f.id} className="nb-th">{f.label}</th>)}
                <th className="nb-th">Created</th>
                <th className="nb-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companyRecords.map(r=>(
                <tr 
                  key={r.id} 
                  onClick={() => setSelectedCompany(r)}
                  className="border-b border-slate-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  {companyFields.map(f => <td key={f.id} className="nb-td">{String(r.data?.[f.key] ?? "")}</td>)}
                  <td className="nb-td">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="nb-td">
                    <button 
                      className="text-red-600 underline hover:text-red-800" 
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm("Are you sure you want to delete this company?")) {
                          await apiJson(`/api/collections/companies/records/${r.id}`, { method: "DELETE" });
                          await loadCompanies();
                        }
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

      <Section title="Tasks">
        <div className="grid md:grid-cols-3 gap-2 mb-3">
          {taskFields.map(f => (
            f.key === 'taskPrompt' ? (
              <textarea
                key={f.id}
                placeholder={f.label}
                value={String(taskRDraft[f.key] ?? "")}
                onChange={e=>setTaskRDraft({ ...taskRDraft, [f.key]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md md:col-span-3"
                rows={3}
              />
            ) : (
              <TextInput 
                key={f.id} 
                placeholder={f.label} 
                value={String(taskRDraft[f.key] ?? "")} 
                onChange={e=>setTaskRDraft({ ...taskRDraft, [f.key]: e.target.value })} 
              />
            )
          ))}
          <div className="md:col-span-3">
            <button className="nb-btn nb-btn-primary" onClick={async () => {
              await apiJson(`/api/collections/tasks/records`, { method: "POST", body: JSON.stringify({ data: taskRDraft }) });
              await loadTasks();
            }}>Add Task</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="nb-table">
            <thead>
              <tr className="border-b border-slate-200">
                {taskFields.map(f => <th key={f.id} className="nb-th">{f.label}</th>)}
                <th className="nb-th">Created</th>
                <th className="nb-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {taskRecords.map(r=>(
                <tr 
                  key={r.id} 
                  onClick={() => setSelectedTask(r)}
                  className="border-b border-slate-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  {taskFields.map(f => (
                    <td key={f.id} className="nb-td">
                      {f.key === 'taskPrompt' ? (
                        <div className="max-w-xs truncate" title={String(r.data?.[f.key] ?? "")}>
                          {String(r.data?.[f.key] ?? "")}
                        </div>
                      ) : (
                        String(r.data?.[f.key] ?? "")
                      )}
                    </td>
                  ))}
                  <td className="nb-td">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="nb-td">
                    <button 
                      className="text-red-600 underline hover:text-red-800" 
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm("Are you sure you want to delete this task?")) {
                          await apiJson(`/api/collections/tasks/records/${r.id}`, { method: "DELETE" });
                          await loadTasks();
                        }
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
                <h3 className="text-xl font-normal">{editingUser ? 'Edit User' : 'User Details'}</h3>
                <div className="flex items-center gap-2">
                  {!editingUser && (
                    <button 
                      onClick={() => startEditingUser(selectedUser)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Edit
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
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
                    {editingUser ? (
                      <input
                        type="text"
                        value={editUserData.name}
                        onChange={(e) => setEditUserData({...editUserData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Enter name"
                      />
                    ) : (
                      <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{selectedUser.name || "No name provided"}</div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    {editingUser ? (
                      <div className="relative group">
                        <button 
                          type="button"
                          onClick={() => setShowModalRoleDropdown(!showModalRoleDropdown)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:border-gray-400 transition-all text-left"
                        >
                          <svg className={`w-4 h-4 transform transition-transform ${showModalRoleDropdown ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span>{editUserData.role === 'user' ? 'User' : 'Admin'}</span>
                        </button>
                        
                        {showModalRoleDropdown && (
                          <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                            <div className="py-2">
                              <button
                                type="button"
                                onClick={() => { 
                                  setEditUserData({...editUserData, role: 'user'}); 
                                  setShowModalRoleDropdown(false); 
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                              >
                                User
                              </button>
                              <button
                                type="button"
                                onClick={() => { 
                                  setEditUserData({...editUserData, role: 'admin'}); 
                                  setShowModalRoleDropdown(false); 
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                              >
                                Admin
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                        <span className="nb-badge">{selectedUser.role === 'user' ? 'User' : 'Admin'}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    {editingUser ? (
                      <div className="relative group">
                        <button 
                          type="button"
                          onClick={() => setShowModalCompanyDropdown(!showModalCompanyDropdown)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:border-gray-400 transition-all text-left"
                        >
                          <svg className={`w-4 h-4 transform transition-transform ${showModalCompanyDropdown ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span>{editUserData.company || "Select Company (optional)"}</span>
                        </button>
                        
                        {showModalCompanyDropdown && (
                          <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                            <div className="py-2">
                              <button
                                type="button"
                                onClick={() => { 
                                  setEditUserData({...editUserData, company: ""}); 
                                  setShowModalCompanyDropdown(false); 
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                              >
                                No Company
                              </button>
                              {companiesList.map(company => (
                                <button
                                  key={company.id}
                                  type="button"
                                  onClick={() => { 
                                    setEditUserData({...editUserData, company: company.name}); 
                                    setShowModalCompanyDropdown(false); 
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                >
                                  {company.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                        {selectedUser.company || "No company"}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                    <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      {new Date(selectedUser.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Page Access Section */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Page Access</label>
                {editingUser ? (
                  <div className="flex flex-wrap gap-4">
                    {Object.entries(editUserData.pageAccess).map(([page, checked]) => (
                      <label key={page} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => setEditUserData({
                            ...editUserData,
                            pageAccess: { ...editUserData.pageAccess, [page]: e.target.checked }
                          })}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm capitalize">{page}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {selectedUser.pageAccess ? Object.entries(selectedUser.pageAccess).filter(([_, hasAccess]) => hasAccess).map(([page]) => (
                      <span key={page} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded capitalize">
                        {page}
                      </span>
                    )) : <span className="text-xs text-gray-500">All pages</span>}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {editingUser && (
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={saveUserEdit}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={cancelUserEdit}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              )}

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
            width: '47.5vw',
            height: '80vh',
            backgroundColor: 'white',
            borderRadius: '8px',
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

      {/* Advisor Details Modal */}
      {selectedAdvisor && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 50
        }}>
          <div style={{
            width: '100%', maxWidth: '896px', aspectRatio: '16/9',
            backgroundColor: 'white', borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)'
          }}>
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-normal">{editingAdvisor ? 'Edit Advisor' : 'Advisor Details'}</h3>
                <div className="flex items-center gap-2">
                  {!editingAdvisor && (
                    <button 
                      onClick={() => {
                        setEditAdvisorData(selectedAdvisor.data || {});
                        setEditingAdvisor(true);
                      }}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Edit
                    </button>
                  )}
                  <button onClick={() => setSelectedAdvisor(null)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto">
                {advisorFields.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    {editingAdvisor ? (
                      field.type === 'image' ? (
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // For now, just store the filename. In production, you'd upload to cloud storage
                                setEditAdvisorData({...editAdvisorData, [field.key]: file.name});
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                          {editAdvisorData[field.key] && (
                            <div className="text-sm text-gray-600">
                              Current: {String(editAdvisorData[field.key])}
                            </div>
                          )}
                        </div>
                      ) : field.key === 'knowledgeFeed' || field.key === 'prompt' ? (
                        <textarea
                          value={String(editAdvisorData[field.key] || "")}
                          onChange={(e) => setEditAdvisorData({...editAdvisorData, [field.key]: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={4}
                          placeholder={field.key === 'prompt' ? 'Enter AI prompt for this advisor...' : 'Enter knowledge feed content...'}
                        />
                      ) : (
                        <input
                          type="text"
                          value={String(editAdvisorData[field.key] || "")}
                          onChange={(e) => setEditAdvisorData({...editAdvisorData, [field.key]: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      )
                    ) : (
                      <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                        {field.type === 'image' ? (
                          selectedAdvisor.data?.[field.key] ? (
                            <div className="flex items-center gap-2">
                              <span>📷</span>
                              <span>{String(selectedAdvisor.data[field.key])}</span>
                            </div>
                          ) : (
                            "No image uploaded"
                          )
                        ) : field.key === 'knowledgeFeed' || field.key === 'prompt' ? (
                          <pre className="whitespace-pre-wrap text-sm">
                            {String(selectedAdvisor.data?.[field.key] || "No data")}
                          </pre>
                        ) : (
                          String(selectedAdvisor.data?.[field.key] || "No data")
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {editingAdvisor && (
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={async () => {
                      await apiJson(`/api/collections/advisors/records/${selectedAdvisor.id}`, { 
                        method: "PUT", 
                        body: JSON.stringify({ data: editAdvisorData }) 
                      });
                      setEditingAdvisor(false);
                      await loadAdvisors();
                      setSelectedAdvisor({...selectedAdvisor, data: editAdvisorData});
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingAdvisor(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Company Details Modal */}
      {selectedCompany && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 50
        }}>
          <div style={{
            width: '100%', maxWidth: '896px', aspectRatio: '16/9',
            backgroundColor: 'white', borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)'
          }}>
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-normal">{editingCompany ? 'Edit Company' : 'Company Details'}</h3>
                <div className="flex items-center gap-2">
                  {!editingCompany && (
                    <button 
                      onClick={() => {
                        setEditCompanyData(selectedCompany.data || {});
                        setEditingCompany(true);
                      }}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Edit
                    </button>
                  )}
                  <button onClick={() => setSelectedCompany(null)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                {companyFields.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    {editingCompany ? (
                      field.type === 'json' ? (
                        <textarea
                          value={JSON.stringify(editCompanyData[field.key] || {}, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              setEditCompanyData({...editCompanyData, [field.key]: parsed});
                            } catch {
                              setEditCompanyData({...editCompanyData, [field.key]: e.target.value});
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                          rows={4}
                        />
                      ) : (
                        <input
                          type="text"
                          value={String(editCompanyData[field.key] || "")}
                          onChange={(e) => setEditCompanyData({...editCompanyData, [field.key]: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      )
                    ) : (
                      <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                        {field.type === 'json' ? (
                          <pre className="text-sm">{JSON.stringify(selectedCompany.data?.[field.key] || {}, null, 2)}</pre>
                        ) : (
                          String(selectedCompany.data?.[field.key] || "No data")
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {editingCompany && (
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={async () => {
                      await apiJson(`/api/collections/companies/records/${selectedCompany.id}`, { 
                        method: "PUT", 
                        body: JSON.stringify({ data: editCompanyData }) 
                      });
                      setEditingCompany(false);
                      await loadCompanies();
                      setSelectedCompany({...selectedCompany, data: editCompanyData});
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingCompany(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 50
        }}>
          <div style={{
            width: '100%', maxWidth: '896px', aspectRatio: '16/9',
            backgroundColor: 'white', borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)'
          }}>
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-normal">{editingTask ? 'Edit Task' : 'Task Details'}</h3>
                <div className="flex items-center gap-2">
                  {!editingTask && (
                    <button 
                      onClick={() => {
                        setEditTaskData(selectedTask.data || {});
                        setEditingTask(true);
                      }}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Edit
                    </button>
                  )}
                  <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                {taskFields.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    {editingTask ? (
                      field.key === 'taskPrompt' ? (
                        <textarea
                          value={String(editTaskData[field.key] || "")}
                          onChange={(e) => setEditTaskData({...editTaskData, [field.key]: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={6}
                          placeholder="Enter the task prompt..."
                        />
                      ) : (
                        <input
                          type="text"
                          value={String(editTaskData[field.key] || "")}
                          onChange={(e) => setEditTaskData({...editTaskData, [field.key]: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      )
                    ) : (
                      <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                        {field.key === 'taskPrompt' ? (
                          <pre className="whitespace-pre-wrap text-sm">
                            {String(selectedTask.data?.[field.key] || "No data")}
                          </pre>
                        ) : (
                          String(selectedTask.data?.[field.key] || "No data")
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {editingTask && (
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={async () => {
                      await apiJson(`/api/collections/tasks/records/${selectedTask.id}`, { 
                        method: "PUT", 
                        body: JSON.stringify({ data: editTaskData }) 
                      });
                      setEditingTask(false);
                      await loadTasks();
                      setSelectedTask({...selectedTask, data: editTaskData});
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingTask(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}