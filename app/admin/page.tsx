"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavigationHeader from "../components/NavigationHeader";

type User = { id:string; email:string; name:string|null; role:string; company:string|null; createdAt:string; pageAccess?:Record<string, boolean> };
type Field = { id:string; label:string; key:string; type:string; required:boolean; order:number };
type RecordT = { id:string; data:Record<string, unknown>; createdAt:string };

function Section({ title, children, defaultOpen = false }: { title:string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section 
      className="nb-card mb-6"
      onClick={() => {
        if (!open) setOpen(true);
      }}
    >
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
  const [selectedAdvisor, setSelectedAdvisor] = useState<RecordT | null>(null);
  const [editingAdvisor, setEditingAdvisor] = useState(false);
  const [editAdvisorData, setEditAdvisorData] = useState<Record<string, unknown>>({});
  const [showAllAdvisorsModal, setShowAllAdvisorsModal] = useState(false);

  // STRUCTURES COLLECTION
  const [structureFields, setStructureFields] = useState<Field[]>([]);
  const [structureRecords, setStructureRecords] = useState<RecordT[]>([]);
  const [structureRDraft, setStructureRDraft] = useState<Record<string, unknown>>({});
  const [structureFDraft, setStructureFDraft] = useState<{label:string; key:string; type:string; required:boolean; order:number}>({ label:"", key:"", type:"text", required:false, order:0 });
  const [selectedStructure, setSelectedStructure] = useState<RecordT | null>(null);
  const [editingStructure, setEditingStructure] = useState(false);
  const [editStructureData, setEditStructureData] = useState<Record<string, unknown>>({});

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

  // TOOLS & PAGES COLLECTION
  const [toolsFields, setToolsFields] = useState<Field[]>([]);
  const [toolsRecords, setToolsRecords] = useState<RecordT[]>([]);
  const [toolsRDraft, setToolsRDraft] = useState<Record<string, unknown>>({});
  const [advisorsForDropdown, setAdvisorsForDropdown] = useState<{id:string; name:string}[]>([]);
  const [selectedTool, setSelectedTool] = useState<RecordT | null>(null);
  const [editingTool, setEditingTool] = useState(false);
  const [editToolData, setEditToolData] = useState<Record<string, unknown>>({});
  const [showAllPagesModal, setShowAllPagesModal] = useState(false);

  // SYSTEM PROMPTS COLLECTION
  const [systemPromptFields, setSystemPromptFields] = useState<Field[]>([]);
  const [systemPromptRecords, setSystemPromptRecords] = useState<RecordT[]>([]);
  const [systemPromptRDraft, setSystemPromptRDraft] = useState<Record<string, unknown>>({});
  const [systemPromptFDraft, setSystemPromptFDraft] = useState<{label:string; key:string; type:string; required:boolean; order:number}>({ label:"", key:"", type:"text", required:false, order:0 });
  const [selectedSystemPrompt, setSelectedSystemPrompt] = useState<RecordT | null>(null);
  const [editingSystemPrompt, setEditingSystemPrompt] = useState(false);
  const [editSystemPromptData, setEditSystemPromptData] = useState<Record<string, unknown>>({});

  // MODAL STATES
  const [selectedCompany, setSelectedCompany] = useState<RecordT | null>(null);
  const [selectedTask, setSelectedTask] = useState<RecordT | null>(null);
  const [editingCompany, setEditingCompany] = useState(false);
  const [editingTask, setEditingTask] = useState(false);
  const [editCompanyData, setEditCompanyData] = useState<Record<string, unknown>>({});
  const [editTaskData, setEditTaskData] = useState<Record<string, unknown>>({});

  // Reset editing state when selected company changes
  useEffect(() => {
    setEditingCompany(false);
    setEditCompanyData({});
  }, [selectedCompany?.id]);

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

  async function loadSystemPrompts() {
    const f: Field[] = await apiJson(`/api/collections/system-prompts/fields`);
    setSystemPromptFields(f);
    const r: RecordT[] = await apiJson(`/api/collections/system-prompts/records`);
    setSystemPromptRecords(r);
    const draft: Record<string, unknown> = {};
    f.forEach(x => { draft[x.key] = ""; });
    setSystemPromptRDraft(draft);
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

  async function loadToolsPages() {
    const f: Field[] = await apiJson(`/api/collections/pages/fields`);
    setToolsFields(f);
    const r: RecordT[] = await apiJson(`/api/collections/pages/records`);
    setToolsRecords(r);
    const draft: Record<string, unknown> = {};
    f.forEach(x => { draft[x.key] = ""; });
    setToolsRDraft(draft);
  }


  useEffect(() => { 
    // Create a style element to forcefully hide the layout header
    const styleElement = document.createElement('style');
    styleElement.id = 'hide-layout-header';
    styleElement.textContent = `
      body > header {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
      }
      html, body { overflow: auto !important; }
      html, body { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      html::-webkit-scrollbar, body::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
    `;
    document.head.appendChild(styleElement);
    
    loadUsers(); 
    loadAdvisors();
    loadStructures();
    loadSystemPrompts();
    loadCompanies();
    loadTasks();
    loadCompaniesList();
    loadToolsPages();
    // fetch advisors for dropdown
    (async () => {
      const records: RecordT[] = await apiJson(`/api/collections/advisors/records`);
      setAdvisorsForDropdown(records.map(r => ({ id: r.id, name: String(r.data?.name || 'Unnamed Advisor') })));
    })();
    
    return () => {
      // Remove the style element when leaving the page
      const styleElement = document.getElementById('hide-layout-header');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedTask) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [selectedTask]);

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

  // SYSTEM PROMPTS: delete record
  async function deleteSystemPromptRecord(id: string) {
    if (confirm("Are you sure you want to delete this system prompt?")) {
      await apiJson(`/api/collections/system-prompts/records/${id}`, { method: "DELETE" });
      await loadSystemPrompts();
    }
  }

  async function addField() {
    await apiJson(`/api/collections/${activeSlug}/fields`, { method: "POST", body: JSON.stringify(fDraft) });
    setFDraft({ label:"", key:"", type:"text", required:false, order:0 }); await loadCollection(activeSlug);
  }
  async function removeField(id: string) { await apiJson(`/api/collections/${activeSlug}/fields/${id}`, { method: "DELETE" }); await loadCollection(activeSlug); }

  async function addRecord() { await apiJson(`/api/collections/${activeSlug}/records`, { method: "POST", body: JSON.stringify({ data: rDraft }) }); await loadCollection(activeSlug); }

  const fieldTypes = useMemo(()=>["text","number","image","json","date"], []);

  // Sort pages so active pages appear first
  const sortedToolsRecords = useMemo(() => {
    return [...toolsRecords].sort((a, b) => {
      const aActive = Boolean(a.data?.active);
      const bActive = Boolean(b.data?.active);
      if (aActive === bActive) return 0;
      return aActive ? -1 : 1; // Active pages come first
    });
  }, [toolsRecords]);

  return (
    <>
      <NavigationHeader />
      <div style={{ paddingTop: 'calc(2.25rem + 1rem)' }}>
        <div className="space-y-6">

      <Section title="Users" defaultOpen={false}>
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
              <span>{uCompany ? (companiesList.find(c => c.id === uCompany)?.name || "Unknown Company") : "Select Company (optional)"}</span>
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
                      onClick={() => { setUCompany(company.id); setShowCompanyDropdown(false); }}
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
                  <td className="nb-td">{u.company ? (companiesList.find(c => c.id === u.company)?.name || "Unknown Company") : "No company"}</td>
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

      <Section title="Pages">
        <div className="grid md:grid-cols-3 gap-2 mb-3">
          {toolsFields.map(f => (
            f.key === 'mainAdvisorId' ? (
              <div key={f.id} className="relative">
                <Select
                  value={String(toolsRDraft[f.key] ?? "")}
                  onChange={e=>setToolsRDraft({ ...toolsRDraft, [f.key]: e.target.value })}
                >
                  <option value="">Select Main Advisor</option>
                  {advisorsForDropdown.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </Select>
              </div>
            ) : f.type === 'boolean' ? (
              <div key={f.id} className="flex items-center gap-2 px-3 py-2">
                <input
                  type="checkbox"
                  checked={Boolean(toolsRDraft[f.key])}
                  onChange={e=>setToolsRDraft({ ...toolsRDraft, [f.key]: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700">{f.label}</label>
              </div>
            ) : (
              <TextInput key={f.id} placeholder={f.label} value={String(toolsRDraft[f.key] ?? "")} onChange={e=>setToolsRDraft({ ...toolsRDraft, [f.key]: e.target.value })} />
            )
          ))}
          <div className="md:col-span-3">
            <button className="nb-btn nb-btn-primary" onClick={async () => {
              await apiJson(`/api/collections/pages/records`, { method: "POST", body: JSON.stringify({ data: toolsRDraft }) });
              await loadToolsPages();
            }}>Add Item</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="nb-table">
            <thead>
              <tr className="border-b border-slate-200">
                {toolsFields
                  .filter(f => ['name', 'description', 'mainAdvisorId', 'active'].includes(f.key))
                  .map(f => <th key={f.id} className="nb-th">{f.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {/* Special "All" row */}
              <tr 
                onClick={() => setShowAllPagesModal(true)}
                className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer bg-blue-50/50"
              >
                <td className="nb-td font-semibold text-blue-600">All</td>
                <td className="nb-td text-gray-600 italic">View all pages summary</td>
                <td className="nb-td text-gray-600 italic">-</td>
                <td className="nb-td text-gray-600 italic">-</td>
              </tr>
              
              {/* Regular pages */}
              {sortedToolsRecords.map(r => (
                <tr 
                  key={r.id} 
                  onClick={() => { setSelectedTool(r); setEditToolData(r.data || {}); setEditingTool(false); }}
                  className="border-b border-slate-100 hover:bg-gray-50 cursor-pointer"
                >
                  {toolsFields
                    .filter(f => ['name', 'description', 'mainAdvisorId', 'active'].includes(f.key))
                    .map(f => (
                      <td key={f.id} className="nb-td">
                        {f.key === 'mainAdvisorId' 
                          ? advisorsForDropdown.find(a => a.id === r.data?.[f.key])?.name || String(r.data?.[f.key] ?? "")
                          : f.key === 'active'
                          ? (r.data?.[f.key] ? '✅ Active' : '❌ Not Active')
                          : String(r.data?.[f.key] ?? "")
                        }
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Structures">
        <div className="grid md:grid-cols-3 gap-2 mb-3">
          {structureFields.map(f => (
            f.type === 'boolean' ? (
              <div key={f.id} className="flex items-center gap-2 px-3 py-2">
                <input
                  type="checkbox"
                  checked={Boolean(structureRDraft[f.key])}
                  onChange={e=>setStructureRDraft({ ...structureRDraft, [f.key]: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700">{f.label}</label>
              </div>
            ) : f.type === 'number' ? (
              <TextInput key={f.id} type="number" placeholder={f.label} value={String(structureRDraft[f.key] ?? "")} onChange={e=>setStructureRDraft({ ...structureRDraft, [f.key]: e.target.value })} />
            ) : (
              <TextInput key={f.id} placeholder={f.label} value={String(structureRDraft[f.key] ?? "")} onChange={e=>setStructureRDraft({ ...structureRDraft, [f.key]: e.target.value })} />
            )
          ))}
          <div className="md:col-span-3">
            <button className="nb-btn nb-btn-primary" onClick={async () => {
              await apiJson(`/api/collections/structures/records`, { method: "POST", body: JSON.stringify({ data: structureRDraft }) });
              await loadStructures();
            }}>Add Structure</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="nb-table">
            <thead>
              <tr className="border-b border-slate-200">
                {structureFields.map(f => <th key={f.id} className="nb-th">{f.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {structureRecords.map(r=>(
                <tr 
                  key={r.id} 
                  onClick={() => setSelectedStructure(r)}
                  className="border-b border-slate-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  {structureFields.map(f => (
                    <td key={f.id} className="nb-td">
                      {f.type === 'json' ? (
                        <div className="max-w-md truncate" title={JSON.stringify(r.data?.[f.key] ?? "")}>
                          {JSON.stringify(r.data?.[f.key] ?? "")}
                        </div>
                      ) : f.type === 'boolean' ? (
                        r.data?.[f.key] ? '✅ Yes' : '❌ No'
                      ) : (
                        String(r.data?.[f.key] ?? "")
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="System Prompts">
        <div className="grid md:grid-cols-3 gap-2 mb-3">
          {systemPromptFields.map(f => (
            <TextInput key={f.id} placeholder={f.label} value={systemPromptRDraft[f.key] ?? ""} onChange={e=>setSystemPromptRDraft({ ...systemPromptRDraft, [f.key]: e.target.value })} />
          ))}
          <div className="md:col-span-3">
            <button className="nb-btn nb-btn-primary" onClick={async () => {
              await apiJson(`/api/collections/system-prompts/records`, { method: "POST", body: JSON.stringify({ data: systemPromptRDraft }) });
              await loadSystemPrompts();
            }}>Add System Prompt</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="nb-table">
            <thead>
              <tr className="border-b border-slate-200">
                {systemPromptFields.map(f => <th key={f.id} className="nb-th">{f.label}</th>)}
                <th className="nb-th">Created</th>
                <th className="nb-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {systemPromptRecords.map(r=>(
                <tr 
                  key={r.id} 
                  onClick={() => setSelectedSystemPrompt(r)}
                  className="border-b border-slate-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  {systemPromptFields.map(f => (
                    <td key={f.id} className="nb-td">
                      {f.key === 'content' ? (
                        <div className="max-w-md truncate" title={String(r.data?.[f.key] ?? "")}>
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
                        if (confirm("Are you sure you want to delete this system prompt?")) {
                          await apiJson(`/api/collections/system-prompts/records/${r.id}`, { method: "DELETE" });
                          await loadSystemPrompts();
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
                {advisorFields
                  .filter(f => ['name', 'role', 'oneliner', 'prompt'].includes(f.key))
                  .map(f => <th key={f.id} className="nb-th">{f.key === 'oneliner' ? 'Style' : f.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {/* Special "All" row */}
              <tr 
                onClick={() => setShowAllAdvisorsModal(true)}
                className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer bg-blue-50/50"
              >
                <td className="nb-td font-semibold text-blue-600">All</td>
                <td className="nb-td text-gray-600 italic">View all advisors summary</td>
                <td className="nb-td text-gray-600 italic" colSpan={2}>-</td>
              </tr>
              
              {/* Regular advisors */}
              {advisorRecords.map(r=>(
                <tr 
                  key={r.id} 
                  onClick={() => setSelectedAdvisor(r)}
                  className="border-b border-slate-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  {advisorFields
                    .filter(f => ['name', 'role', 'oneliner', 'prompt'].includes(f.key))
                    .map(f => (
                      <td key={f.id} className="nb-td">
                        {String(r.data?.[f.key] ?? "")}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Companies">
        <div className="flex gap-4 mb-6 items-end">
          {companyFields.filter(f => f.label === 'Name').map(f => (
            <div key={f.id} className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                type="text"
                placeholder={f.label}
                value={String(companyRDraft[f.key] ?? "")}
                onChange={e => setCompanyRDraft({ ...companyRDraft, [f.key]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          ))}
          <div>
            <button className="nb-btn nb-btn-primary" onClick={async () => {
              await apiJson(`/api/collections/companies/records`, { method: "POST", body: JSON.stringify({ data: companyRDraft }) });
              await loadCompanies();
              setCompanyRDraft({});
            }}>Add Company</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="nb-table">
            <thead>
              <tr className="border-b border-slate-200">
                {companyFields
                  .filter(f => !['Business Classification - Additional Details', 'Business Classification Confidence', 'Business Classification Rational', 'Business Classification Rationale', 'Business Classification Evidence', 'Business Classification Modeling Implications'].includes(f.label))
                  .map(f => <th key={f.id} className="nb-th">{f.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {companyRecords.map(r=>(
                <tr 
                  key={r.id} 
                  onClick={() => setSelectedCompany(r)}
                  className="border-b border-slate-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  {companyFields
                    .filter(f => !['Business Classification - Additional Details', 'Business Classification Confidence', 'Business Classification Rational', 'Business Classification Rationale', 'Business Classification Evidence', 'Business Classification Modeling Implications'].includes(f.label))
                    .map(f => {
                      const value = String(r.data?.[f.key] ?? "");
                      const displayValue = f.label === 'Raw Data' 
                        ? value.split(/\s+/).slice(0, 2).join(' ') + (value.split(/\s+/).length > 2 ? '...' : '')
                        : value;
                      return <td key={f.id} className="nb-td">{displayValue}</td>;
                    })}
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
                          <span>{editUserData.company ? (companiesList.find(c => c.id === editUserData.company)?.name || "Unknown Company") : "Select Company (optional)"}</span>
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
                                    setEditUserData({...editUserData, company: company.id}); 
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
                        {selectedUser.company ? (companiesList.find(c => c.id === selectedUser.company)?.name || "Unknown Company") : "No company"}
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

      {/* Structure Details Modal */}
      {selectedStructure && (
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
                <h3 className="text-xl font-normal">{editingStructure ? 'Edit Structure' : 'Structure Details'}</h3>
                <div className="flex items-center gap-2">
                  {!editingStructure && (
                    <button 
                      onClick={() => {
                        setEditStructureData(selectedStructure.data || {});
                        setEditingStructure(true);
                      }}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Edit
                    </button>
                  )}
                  <button onClick={() => setSelectedStructure(null)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto">
                {structureFields.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    {editingStructure ? (
                      field.type === 'json' ? (
                        <div>
                          <textarea
                            value={JSON.stringify(editStructureData[field.key] || {}, null, 2)}
                            onChange={(e) => {
                              try {
                                const parsed = JSON.parse(e.target.value);
                                setEditStructureData({...editStructureData, [field.key]: parsed});
                              } catch {
                                setEditStructureData({...editStructureData, [field.key]: e.target.value});
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                            rows={8}
                            placeholder="Enter valid JSON..."
                          />
                          <div className="text-xs text-gray-500 mt-1">JSON format required</div>
                        </div>
                      ) : field.type === 'boolean' ? (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={Boolean(editStructureData[field.key])}
                            onChange={(e) => setEditStructureData({...editStructureData, [field.key]: e.target.checked})}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{editStructureData[field.key] ? 'Yes' : 'No'}</span>
                        </label>
                      ) : field.type === 'number' ? (
                        <input
                          type="number"
                          value={String(editStructureData[field.key] || "")}
                          onChange={(e) => setEditStructureData({...editStructureData, [field.key]: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      ) : (
                        <input
                          type="text"
                          value={String(editStructureData[field.key] || "")}
                          onChange={(e) => setEditStructureData({...editStructureData, [field.key]: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      )
                    ) : (
                      <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                        {field.type === 'json' ? (
                          <pre className="text-sm font-mono overflow-x-auto">{JSON.stringify(selectedStructure.data?.[field.key] || {}, null, 2)}</pre>
                        ) : field.type === 'boolean' ? (
                          selectedStructure.data?.[field.key] ? '✅ Yes' : '❌ No'
                        ) : (
                          String(selectedStructure.data?.[field.key] || "No data")
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {editingStructure && (
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={async () => {
                      await apiJson(`/api/collections/structures/records/${selectedStructure.id}`, { 
                        method: "PUT", 
                        body: JSON.stringify({ data: editStructureData }) 
                      });
                      setEditingStructure(false);
                      await loadStructures();
                      setSelectedStructure({...selectedStructure, data: editStructureData});
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingStructure(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {!editingStructure && (
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={async () => {
                      if (confirm('Delete this structure?')) {
                        await apiJson(`/api/collections/structures/records/${selectedStructure.id}`, { method: 'DELETE' });
                        setSelectedStructure(null);
                        await loadStructures();
                      }
                    }}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Company Details Modal */}
      {selectedCompany && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 50
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedCompany(null);
              setEditingCompany(false);
              setEditCompanyData({});
            }
          }}
        >
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
                    <>
                      <button 
                        onClick={() => {
                          setEditCompanyData(selectedCompany.data || {});
                          setEditingCompany(true);
                        }}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm('Are you sure you want to empty all content except the name? This action cannot be undone.')) {
                            const emptyData: Record<string, unknown> = { name: selectedCompany.data?.name || "" };
                            companyFields.forEach(field => {
                              if (field.key !== 'name') {
                                emptyData[field.key] = field.type === 'json' ? {} : "";
                              }
                            });
                            await apiJson(`/api/collections/companies/records/${selectedCompany.id}`, { 
                              method: "PUT", 
                              body: JSON.stringify({ data: emptyData }) 
                            });
                            await loadCompanies();
                            setSelectedCompany({...selectedCompany, data: emptyData});
                          }
                        }}
                        className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
                      >
                        Empty Content
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
                            await apiJson(`/api/collections/companies/records/${selectedCompany.id}`, { method: "DELETE" });
                            await loadCompanies();
                            setSelectedCompany(null);
                          }
                        }}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </>
                  )}
                  <button onClick={() => {
                    setSelectedCompany(null);
                    setEditingCompany(false);
                    setEditCompanyData({});
                  }} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto">
                {companyFields.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    {editingCompany ? (
                      field.type === 'json' ? (
                        <div>
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
                            rows={8}
                            placeholder="Enter valid JSON..."
                          />
                          <div className="text-xs text-gray-500 mt-1">JSON format required</div>
                        </div>
                      ) : field.type === 'richtext' ? (
                        <textarea
                          value={String(editCompanyData[field.key] || "")}
                          onChange={(e) => setEditCompanyData({...editCompanyData, [field.key]: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={12}
                          placeholder="Enter large text content..."
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
                          <pre className="text-sm font-mono overflow-x-auto">{JSON.stringify(selectedCompany.data?.[field.key] || {}, null, 2)}</pre>
                        ) : field.type === 'richtext' ? (
                          <div className="whitespace-pre-wrap text-sm max-h-48 overflow-y-auto">
                            {String(selectedCompany.data?.[field.key] || "No data")}
                          </div>
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
                    onClick={() => {
                      setEditingCompany(false);
                      setEditCompanyData({});
                    }}
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

      {/* Pages Details Modal */}
      {selectedTool && (
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
                <h3 className="text-xl font-normal">{editingTool ? 'Edit Item' : 'Item Details'}</h3>
                <div className="flex items-center gap-2">
                  {!editingTool && (
                    <button 
                      onClick={() => {
                        setEditToolData(selectedTool.data || {});
                        setEditingTool(true);
                      }}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Edit
                    </button>
                  )}
                  <button onClick={() => setSelectedTool(null)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto">
                {toolsFields.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    {editingTool ? (
                      field.key === 'mainAdvisorId' ? (
                        <select
                          className="nb-select"
                          value={String(editToolData[field.key] ?? '')}
                          onChange={(e)=> setEditToolData({ ...editToolData, [field.key]: e.target.value })}
                        >
                          <option value="">Select Main Advisor</option>
                          {advisorsForDropdown.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      ) : field.type === 'boolean' ? (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={Boolean(editToolData[field.key])}
                            onChange={(e) => setEditToolData({...editToolData, [field.key]: e.target.checked})}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{editToolData[field.key] ? 'Active' : 'Not Active'}</span>
                        </label>
                      ) : (
                        <input
                          type="text"
                          value={String(editToolData[field.key] || "")}
                          onChange={(e) => setEditToolData({...editToolData, [field.key]: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      )
                    ) : (
                      <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                        {field.key === 'mainAdvisorId' ? (
                          advisorsForDropdown.find(a => a.id === String(selectedTool.data?.[field.key] || ''))?.name || 'No data'
                        ) : field.type === 'boolean' ? (
                          selectedTool.data?.[field.key] ? '✅ Active' : '❌ Not Active'
                        ) : (
                          String(selectedTool.data?.[field.key] || 'No data')
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {editingTool && (
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={async () => {
                      await apiJson(`/api/collections/pages/records/${selectedTool.id}`, { 
                        method: 'PUT', 
                        body: JSON.stringify({ data: editToolData }) 
                      });
                      setEditingTool(false);
                      await loadToolsPages();
                      setSelectedTool({...selectedTool, data: editToolData});
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingTool(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {!editingTool && (
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={async () => {
                      if (confirm('Delete this item?')) {
                        await apiJson(`/api/collections/pages/records/${selectedTool.id}`, { method: 'DELETE' });
                        setSelectedTool(null);
                        await loadToolsPages();
                      }
                    }}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All Advisors Summary Modal */}
      {showAllAdvisorsModal && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 50
          }}
          onClick={() => setShowAllAdvisorsModal(false)}
        >
          <div 
            style={{
              width: '100%', maxWidth: '1200px', maxHeight: '90vh',
              backgroundColor: 'white', borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
              display: 'flex', flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 flex flex-col h-full" style={{ maxHeight: '90vh' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">All Advisors Summary</h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const header = "Name\tRole\tPrompt\n";
                      const rows = advisorRecords.map(advisor => {
                        const name = String(advisor.data?.name || '');
                        const role = String(advisor.data?.role || '');
                        const prompt = String(advisor.data?.prompt || '');
                        return `${name}\t${role}\t${prompt}`;
                      }).join('\n');
                      const content = header + rows;
                      navigator.clipboard.writeText(content).then(() => {
                        alert('All advisors data copied to clipboard!');
                      });
                    }}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    title="Copy to clipboard"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button onClick={() => setShowAllAdvisorsModal(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-white border-b-2 border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-50">Name</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-50">Role</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-50">Prompt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advisorRecords.map((advisor, index) => (
                      <tr 
                        key={advisor.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{String(advisor.data?.name || '')}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{String(advisor.data?.role || '')}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{String(advisor.data?.prompt || '')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-500 text-center">
                Total: {advisorRecords.length} advisors
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Pages Summary Modal */}
      {showAllPagesModal && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 50
          }}
          onClick={() => setShowAllPagesModal(false)}
        >
          <div 
            style={{
              width: '100%', maxWidth: '1200px', maxHeight: '90vh',
              backgroundColor: 'white', borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
              display: 'flex', flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 flex flex-col h-full" style={{ maxHeight: '90vh' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">All Pages Summary</h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const header = "Name\tDescription\tMain Advisor\n";
                      const rows = toolsRecords.map(page => {
                        const name = String(page.data?.name || '');
                        const description = String(page.data?.description || '');
                        const advisor = advisorsForDropdown.find(a => a.id === page.data?.mainAdvisorId)?.name || '-';
                        return `${name}\t${description}\t${advisor}`;
                      }).join('\n');
                      const content = header + rows;
                      navigator.clipboard.writeText(content).then(() => {
                        alert('All pages data copied to clipboard!');
                      });
                    }}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    title="Copy to clipboard"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button onClick={() => setShowAllPagesModal(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-white border-b-2 border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-50">Name</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-50">Description</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-50">Main Advisor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {toolsRecords.map((page, index) => (
                      <tr 
                        key={page.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{String(page.data?.name || '')}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{String(page.data?.description || '')}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {advisorsForDropdown.find(a => a.id === page.data?.mainAdvisorId)?.name || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-500 text-center">
                Total: {toolsRecords.length} pages
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 50,
            overflow: 'hidden'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedTask(null);
            }
          }}
        >
          <div 
            style={{
              width: '100%', maxWidth: '896px', maxHeight: '90vh',
              backgroundColor: 'white', borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
              display: 'flex', flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 flex flex-col h-full max-h-[90vh]">
              <div className="flex items-center justify-between mb-6 flex-shrink-0">
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
              <div className="flex-1 space-y-4 overflow-y-auto min-h-0 pr-2" style={{ scrollbarWidth: 'thin' }}>
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
                <div className="mt-6 flex gap-2 flex-shrink-0 border-t pt-4">
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
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Advisor Details</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingAdvisor(true);
                      setEditAdvisorData(selectedAdvisor.data || {});
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setSelectedAdvisor(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {advisorFields.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    {editingAdvisor ? (
                      field.type === 'image' ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={String(editAdvisorData[field.key] || '')}
                            onChange={e => setEditAdvisorData({...editAdvisorData, [field.key]: e.target.value})}
                            placeholder="Image URL or filename"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex items-center gap-2">
                            <label className="nb-btn nb-btn-secondary cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const inputEl = e.currentTarget;
                                  const file = inputEl.files?.[0];
                                  if (!file) return;
                                  const fd = new FormData();
                                  fd.append('file', file);
                                  try {
                                    const res = await fetch('/api/upload', { method: 'POST', body: fd });
                                    const json = await res.json();
                                    if (res.ok && json?.filePath) {
                                      setEditAdvisorData({ ...editAdvisorData, [field.key]: json.filePath });
                                    } else {
                                      alert(json?.error || 'Upload failed');
                                    }
                                  } catch (err) {
                                    console.error('Upload error', err);
                                    alert('Upload failed');
                                  } finally {
                                    inputEl.value = '';
                                  }
                                }}
                              />
                              Upload Image
                            </label>
                          </div>
                          {editAdvisorData[field.key] && (
                            <div className="w-32 h-32 border border-gray-200 rounded-md overflow-hidden">
                              <img 
                                src={(String(editAdvisorData[field.key]).startsWith('http') || String(editAdvisorData[field.key]).startsWith('/uploads/')) ? String(editAdvisorData[field.key]) : `/uploads/${editAdvisorData[field.key]}`}
                                alt="Preview" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <textarea
                          value={String(editAdvisorData[field.key] || '')}
                          onChange={e => setEditAdvisorData({...editAdvisorData, [field.key]: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={field.key === 'prompt' ? 4 : 2}
                        />
                      )
                    ) : (
                      field.type === 'image' && selectedAdvisor.data?.[field.key] ? (
                        <div className="w-32 h-32 border border-gray-200 rounded-md overflow-hidden">
                          <img 
                            src={(String(selectedAdvisor.data[field.key]).startsWith('http') || String(selectedAdvisor.data[field.key]).startsWith('/uploads/')) ? String(selectedAdvisor.data[field.key]) : `/uploads/${selectedAdvisor.data[field.key]}`}
                            alt={field.label} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                          {String(selectedAdvisor.data?.[field.key] || 'Not set')}
                        </div>
                      )
                    )}
                  </div>
                ))}

                {/* Pages as Main Advisor Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Pages as Main Advisor</label>
                  <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                    {(() => {
                      const pagesAsMainAdvisor = toolsRecords
                        .filter(page => (page.data as any)?.mainAdvisorId === selectedAdvisor.id)
                        .map(page => String((page.data as any)?.name || 'Unnamed Page'));
                      return pagesAsMainAdvisor.length > 0 ? pagesAsMainAdvisor.join(', ') : 'Not main advisor on any pages';
                    })()}
                  </div>
                </div>
              </div>
              {editingAdvisor && (
                <div className="flex justify-between items-center p-6 border-t border-gray-200">
                  <button
                    onClick={async () => {
                      await apiJson(`/api/collections/advisors/records/${selectedAdvisor.id}`, { 
                        method: 'PUT', 
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
                  <button
                    onClick={async () => {
                      if (confirm('Delete this advisor?')) {
                        await apiJson(`/api/collections/advisors/records/${selectedAdvisor.id}`, { method: 'DELETE' });
                        setSelectedAdvisor(null);
                        await loadAdvisors();
                      }
                    }}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* System Prompt Modal */}
      {selectedSystemPrompt && (
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
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">System Prompt Details</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingSystemPrompt(true);
                      setEditSystemPromptData(selectedSystemPrompt.data || {});
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setSelectedSystemPrompt(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {systemPromptFields.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    {editingSystemPrompt ? (
                      <textarea
                        value={String(editSystemPromptData[field.key] || '')}
                        onChange={e => setEditSystemPromptData({...editSystemPromptData, [field.key]: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={field.key === 'content' ? 8 : 2}
                      />
                    ) : (
                      <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md whitespace-pre-wrap">
                        {String(selectedSystemPrompt.data?.[field.key] || 'Not set')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {editingSystemPrompt && (
                <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => {
                      setEditingSystemPrompt(false);
                      setEditSystemPromptData({});
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      await apiJson(`/api/collections/system-prompts/records/${selectedSystemPrompt.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({ data: editSystemPromptData })
                      });
                      setEditingSystemPrompt(false);
                      setSelectedSystemPrompt(null);
                      await loadSystemPrompts();
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Delete this system prompt?')) {
                        await apiJson(`/api/collections/system-prompts/records/${selectedSystemPrompt.id}`, { method: 'DELETE' });
                        setSelectedSystemPrompt(null);
                        await loadSystemPrompts();
                      }
                    }}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </>
  );
}