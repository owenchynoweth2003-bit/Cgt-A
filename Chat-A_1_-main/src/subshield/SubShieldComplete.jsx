import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  FileText,
  HardHat,
  History,
  Lock,
  Mail,
  RefreshCcw,
  Send,
  Shield,
  ShieldCheck,
  Truck,
  Upload,
  User,
  X,
  Zap,
} from "lucide-react";
import { initialData } from "./data.js";
import {
  countDocuments,
  formatMoney,
  getComplianceScore,
  getStatus,
  packagePolicies,
  readStoredData,
  writeStoredData,
} from "./utils.js";
import "./styles.css";
import "./debug.css";
import "./premium.css";

function policyIcon(type) {
  return { workers: HardHat, liability: ShieldCheck, auto: Truck, license: FileText }[type] || Shield;
}

function addActivity(state, title, body) {
  return [{ id: String(Date.now()), title, body, time: "Just now" }, ...state.activity].slice(0, 20);
}

export default function SubShieldComplete() {
  const [data, setData] = useState(() => readStoredData(initialData));
  const [view, setView] = useState("vault");
  const [policyId, setPolicyId] = useState("wc");
  const [contractorId, setContractorId] = useState("turner");
  const [project, setProject] = useState("Downtown Marriott Remodel");
  const [newProject, setNewProject] = useState("");
  const [modal, setModal] = useState(null);

  const score = useMemo(() => getComplianceScore(data.policies), [data.policies]);
  const docs = countDocuments(data.policies);
  const critical = data.policies.filter((policy) => policy.daysRemaining <= 10);
  const selectedPolicy = data.policies.find((policy) => policy.id === policyId) || data.policies[0];
  const selectedContractor = data.contractors.find((contractor) => contractor.id === contractorId) || data.contractors[0];

  function commit(next) {
    setData(next);
    writeStoredData(next);
  }

  function renewPolicy(id) {
    const policy = data.policies.find((item) => item.id === id);
    if (!policy) return;

    commit({
      ...data,
      policies: data.policies.map((item) =>
        item.id === id ? { ...item, daysRemaining: 365, expires: "2027-06-01", statusNote: "Renewed and ready for routing." } : item
      ),
      activity: addActivity(data, `${policy.name} renewed`, `${policy.carrier} policy ${policy.policyNumber} is active for 365 days.`),
    });
  }

  function shopPolicy(id) {
    const policy = data.policies.find((item) => item.id === id);
    if (!policy) return;
    const savings = Math.min(520, Math.round(policy.premium * 0.18));

    commit({
      ...data,
      policies: data.policies.map((item) =>
        item.id === id
          ? { ...item, carrier: "NEXT Insurance", premium: Math.max(350, item.premium - savings), daysRemaining: 365, expires: "2027-06-01", statusNote: `Quoted and switched. Estimated savings: ${formatMoney(savings)}/yr.` }
          : item
      ),
      activity: addActivity(data, `${policy.name} premium lowered`, `Estimated savings: ${formatMoney(savings)}/yr.`),
    });
  }

  function vaultUmbrella() {
    if (data.policies.some((policy) => policy.type === "umbrella")) {
      setModal(null);
      return;
    }

    const policy = {
      id: `umbrella-${Date.now()}`,
      type: "umbrella",
      name: "Umbrella / Excess Liability",
      carrier: "Hiscox Insurance Co.",
      policyNumber: "UM-7740921",
      daysRemaining: 318,
      premium: 980,
      limit: "$2M excess liability",
      expires: "2027-04-15",
      statusNote: "Newly vaulted from original carrier-issued PDF.",
      documents: ["Umbrella certificate"],
    };

    commit({
      ...data,
      policies: [...data.policies, policy],
      activity: addActivity(data, "Umbrella policy vaulted", "Original Hiscox PDF added to the verified vault."),
    });
    setPolicyId(policy.id);
    setModal(null);
  }

  function sendPackage() {
    const finalProject = newProject.trim() || project;
    const packageDocCount = countDocuments(packagePolicies(data.policies));
    const contractors = data.contractors.map((contractor) => {
      if (contractor.id !== selectedContractor.id || contractor.projects.includes(finalProject)) return contractor;
      return { ...contractor, projects: [finalProject, ...contractor.projects] };
    });

    commit({
      ...data,
      contractors,
      activity: addActivity(data, `COI sent to ${selectedContractor.name}`, `${finalProject} · ${packageDocCount} verified files routed to ${selectedContractor.email}.`),
    });
    setNewProject("");
    setModal("sent");
  }

  function resetDemo() {
    commit(initialData);
    setPolicyId("wc");
    setContractorId("turner");
    setProject("Downtown Marriott Remodel");
    setModal(null);
  }

  return (
    <div className="ss-app">
      <div className="ss-layout">
        <aside className="ss-sidebar">
          <Brand />
          <nav>
            <NavButton active={view === "vault"} icon={ShieldCheck} label="Vault" onClick={() => setView("vault")} />
            <NavButton active={view === "contractors"} icon={Building2} label="GC Directory" onClick={() => setView("contractors")} />
            <NavButton active={view === "activity"} icon={History} label="Activity" onClick={() => setView("activity")} />
            <NavButton active={view === "profile"} icon={User} label="Profile" onClick={() => setView("profile")} />
          </nav>
          <div className="ss-side-card">
            <span className="ss-eyebrow">Package ready</span>
            <strong>{docs} files</strong>
            <p className="ss-muted">Original carrier-issued documents are ready to route.</p>
            <button className="ss-button" onClick={() => setModal("send")}>Send COI</button>
          </div>
        </aside>

        <main className="ss-main">
          <Header view={view} onScan={() => setModal("scan")} onActivity={() => setView("activity")} />
          {view === "vault" && <VaultView score={score} docs={docs} critical={critical} policies={data.policies} selectedPolicy={selectedPolicy} onSelectPolicy={setPolicyId} onRenew={renewPolicy} onShop={shopPolicy} onSend={() => setModal("send")} onScan={() => setModal("scan")} />}
          {view === "contractors" && <ContractorsView contractors={data.contractors} onSend={(contractor) => { setContractorId(contractor.id); setProject(contractor.projects[0] || "New Project"); setModal("send"); }} />}
          {view === "activity" && <ActivityView activity={data.activity} />}
          {view === "profile" && <ProfileView onReset={resetDemo} />}
        </main>
      </div>

      {modal === "scan" && <ScanModal onClose={() => setModal(null)} onVault={vaultUmbrella} />}
      {modal === "send" && <SendModal contractors={data.contractors} policies={packagePolicies(data.policies)} contractor={selectedContractor} project={project} newProject={newProject} onContractorChange={(id) => { const contractor = data.contractors.find((item) => item.id === id); setContractorId(id); setProject(contractor?.projects[0] || "New Project"); }} onProjectChange={setProject} onNewProjectChange={setNewProject} onClose={() => setModal(null)} onSend={sendPackage} />}
      {modal === "sent" && <SuccessModal onClose={() => setModal(null)} />}
    </div>
  );
}

function Brand() {
  return <div className="ss-brand"><span className="ss-brand-mark"><Shield size={20} /></span><div><b>SubShield</b><small className="ss-small">Compliance vault</small></div></div>;
}

function Header({ view, onScan, onActivity }) {
  const titles = { vault: "Document Vault", contractors: "GC Directory", activity: "Activity Log", profile: "Company Profile" };
  return <header className="ss-top"><div><span className="ss-eyebrow">Subcontractor compliance</span><h1>{titles[view]}</h1></div><div className="ss-top-actions"><button className="ss-icon-button" onClick={onScan}><Camera size={18} /></button><button className="ss-icon-button" onClick={onActivity}><Bell size={18} /></button></div></header>;
}

function NavButton({ active, icon: Icon, label, onClick }) {
  return <button className={`ss-nav ${active ? "active" : ""}`} onClick={onClick}><Icon size={19} /> {label}</button>;
}

function VaultView({ score, docs, critical, policies, selectedPolicy, onSelectPolicy, onRenew, onShop, onSend, onScan }) {
  return <div className="ss-grid"><section className="ss-card ss-span"><div className="ss-hero"><div><span className="ss-eyebrow">{critical.length ? "Action needed" : "Job-site ready"}</span><h2>{score}% compliant</h2><p>{critical.length ? "Renew the critical policy before routing new COI packages." : "All required policies are current and ready for routing."}</p><div className="ss-row"><button className="ss-button" onClick={onSend}><Send size={16} /> Send package</button><button className="ss-button soft" onClick={onScan}><Upload size={16} /> Add document</button></div></div><Score value={score} /></div></section><section className="ss-card"><Section title="Insurance vault" sub={`${docs} verified files`} />{policies.map((policy) => <PolicyRow key={policy.id} policy={policy} selected={policy.id === selectedPolicy.id} onClick={() => onSelectPolicy(policy.id)} />)}</section><section className="ss-card"><PolicyDetail policy={selectedPolicy} onRenew={() => onRenew(selectedPolicy.id)} onShop={() => onShop(selectedPolicy.id)} onSend={onSend} /></section></div>;
}

function Score({ value }) {
  const cls = value >= 85 ? "success" : value >= 65 ? "warning" : "danger";
  return <div className={`ss-score ${cls}`}><b>{value}</b><span>score</span></div>;
}

function PolicyRow({ policy, selected, onClick }) {
  const Icon = policyIcon(policy.type);
  const status = getStatus(policy.daysRemaining);
  return <button className={`ss-policy ${selected ? "selected" : ""}`} onClick={onClick}><span className="ss-icon-tile"><Icon size={20} /></span><span className="ss-policy-copy"><b>{policy.name}</b><small>{policy.carrier} · {policy.policyNumber}</small></span><em className={`ss-status ${status.className}`}>{status.label}</em></button>;
}

function PolicyDetail({ policy, onRenew, onShop, onSend }) {
  const Icon = policyIcon(policy.type);
  const status = getStatus(policy.daysRemaining);
  const width = `${Math.max(5, Math.min(100, policy.daysRemaining / 1.2))}%`;
  return <div><div className="ss-detail-head"><span className="ss-icon-tile"><Icon size={22} /></span><div><span className="ss-eyebrow">Policy detail</span><h2>{policy.name}</h2><p className="ss-muted">{policy.carrier} · {policy.policyNumber}</p></div></div><div className="ss-bar-top"><span>{policy.daysRemaining} days left</span><span>{formatMoney(policy.premium)}/yr</span></div><div className="ss-bar"><span className={status.className} style={{ width }} /></div><div className="ss-info-grid"><Info label="Limit" value={policy.limit} /><Info label="Expiration" value={policy.expires} /><Info label="Documents" value={`${policy.documents.length} verified`} /><Info label="Carrier" value={policy.carrier} /></div><div className={`ss-note ${status.className === "danger" ? "danger" : ""}`}><AlertTriangle size={16} /> {policy.statusNote}</div><Section title="Verified documents" sub={`${policy.documents.length} files`} />{policy.documents.map((document) => <DocumentRow key={document} name={document} />)}<div className="ss-row">{policy.daysRemaining <= 10 ? <button className="ss-button" onClick={onRenew}><Zap size={16} /> Renew now</button> : <button className="ss-button soft" onClick={onShop}>Lower bill</button>}<button className="ss-button soft" onClick={onSend}><Send size={16} /> Send</button></div></div>;
}

function ContractorsView({ contractors, onSend }) {
  return <div className="ss-grid"><section className="ss-card ss-span"><Section title="Saved general contractors" sub="Certificate holders and project requirements" />{contractors.map((contractor) => <button key={contractor.id} className="ss-gc" onClick={() => onSend(contractor)}><span className="ss-gc-avatar">{contractor.initials}</span><span className="ss-gc-copy"><b>{contractor.name}</b><small>{contractor.projects.length} projects · {contractor.email}</small></span><Send size={16} /></button>)}</section><section className="ss-card"><Section title="Routing quality" sub="Saved data" /><p className="ss-muted">Certificate holders, emails, requirements, and project history are saved so package routing is faster and less error-prone.</p></section></div>;
}

function ActivityView({ activity }) {
  return <section className="ss-card"><Section title="Activity log" sub="Renewals, uploads, sends, and savings" />{activity.map((item) => <div className="ss-activity" key={item.id}><CheckCircle2 size={18} color="#0f8f68" /><span><b>{item.title}</b><small>{item.body}</small><small>{item.time}</small></span></div>)}</section>;
}

function ProfileView({ onReset }) {
  return <div className="ss-grid"><section className="ss-card"><div className="ss-profile"><div className="ss-avatar">ST</div><h2>SubShield Tile Co.</h2><p className="ss-muted">Tile subcontractor · Austin, TX</p><span className="ss-pill"><Lock size={14} /> Original document vault enabled</span></div></section><section className="ss-card"><Section title="Settings" sub="Prototype preferences" /><Setting label="Push renewal alerts" /><Setting label="Verified COI routing" /><Setting label="Auto-shop better rates" /></section><section className="ss-card"><Section title="Demo controls" sub="Testing helper" /><p className="ss-muted">Reset saved demo data if your browser still has old prototype state.</p><button className="ss-button soft" onClick={onReset}><RefreshCcw size={16} /> Reset demo data</button></section></div>;
}

function Setting({ label }) {
  return <button className="ss-setting"><span>{label}</span><span className="ss-toggle on"><i /></span></button>;
}

function SendModal({ contractors, policies, contractor, project, newProject, onContractorChange, onProjectChange, onNewProjectChange, onClose, onSend }) {
  const finalProject = newProject.trim() || project;
  const docs = countDocuments(policies);
  return <Modal title="Review COI package" onClose={onClose}><label className="ss-field">General contractor<select value={contractor.id} onChange={(event) => onContractorChange(event.target.value)}>{contractors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="ss-field">Saved project<select value={project} onChange={(event) => onProjectChange(event.target.value)}>{contractor.projects.map((item) => <option key={item}>{item}</option>)}</select></label><label className="ss-field">Or create new project<input value={newProject} onChange={(event) => onNewProjectChange(event.target.value)} placeholder="Example: PDX186 Tile Buildout" /></label><div className="ss-review"><div className="ss-review-box"><b>Certificate holder</b><pre>{contractor.holder}</pre></div><div className="ss-review-box"><b>Requirements</b><p>{contractor.requirements}</p></div></div><div className="ss-email"><b><Mail size={16} /> Cover email preview</b><p><strong>To:</strong> {contractor.email}</p><p><strong>Subject:</strong> COI Package — {finalProject}</p><p>Hello {contractor.contact.split(" ")[0]}, please see the attached verified insurance package for {finalProject}.</p></div>{policies.map((policy) => policy.documents.map((document) => <DocumentRow key={`${policy.id}-${document}`} name={`${policy.name} · ${document}`} />))}<footer className="ss-footer"><span>{docs} verified files ready</span><button className="ss-button" onClick={onSend}><Send size={16} /> Send package</button></footer></Modal>;
}

function ScanModal({ onClose, onVault }) {
  return <Modal title="Vault a document" onClose={onClose}><div className="ss-upload"><Upload size={30} /><h3>Upload carrier-issued PDF</h3><p className="ss-muted">Prototype mode: this simulates reading an Umbrella / Excess Liability certificate.</p></div><div className="ss-detected"><b>Detected type</b><span>Umbrella / Excess Liability</span><b>Carrier</b><span>Hiscox Insurance Co.</span><b>Policy number</b><span>UM-7740921</span></div><button className="ss-button" onClick={onVault}><Lock size={16} /> Vault verified policy</button></Modal>;
}

function SuccessModal({ onClose }) {
  return <Modal title="Package delivered" onClose={onClose}><div className="ss-empty"><CheckCircle2 size={48} color="#0f8f68" /><h2>Verified COI package sent</h2><p>The send was saved in the activity log.</p><button className="ss-button" onClick={onClose}>Done</button></div></Modal>;
}

function DocumentRow({ name }) {
  return <div className="ss-doc"><span className="ss-pdf">PDF</span><div><b>{name}</b><small>Original carrier-issued document · verified</small></div><em className="ss-verified"><Check size={13} /> Verified</em></div>;
}

function Section({ title, sub }) {
  return <div className="ss-section"><div><h2>{title}</h2>{sub && <p>{sub}</p>}</div></div>;
}

function Info({ label, value }) {
  return <div className="ss-info"><span>{label}</span><b>{value}</b></div>;
}

function Modal({ title, children, onClose }) {
  return <div className="ss-modal-bg"><section className="ss-modal"><button className="ss-close" onClick={onClose}><X size={18} /></button><h2>{title}</h2>{children}</section></div>;
}
