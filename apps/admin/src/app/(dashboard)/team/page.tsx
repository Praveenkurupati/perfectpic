"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  Users, 
  UserPlus, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Key, 
  ShieldCheck, 
  Mail, 
  Building, 
  Clock, 
  MoreVertical,
  X,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  twoFactorEnabled: boolean;
  lastActive: string;
  status: "active" | "suspended";
}

const mockTeam: TeamMember[] = [
  {
    id: "tm-1",
    name: "Praveen Kurupati",
    email: "praveen@perfectpic.in",
    role: "Super Admin",
    department: "Executive",
    twoFactorEnabled: true,
    lastActive: "Just now",
    status: "active",
  },
  {
    id: "tm-2",
    name: "Vikram Sengupta",
    email: "vikram.ops@perfectpic.in",
    role: "Operations Manager",
    department: "Fulfillment & SLA",
    twoFactorEnabled: true,
    lastActive: "12 mins ago",
    status: "active",
  },
  {
    id: "tm-3",
    name: "Rajesh Kannan",
    email: "rajesh.press@perfectpic.in",
    role: "Production Floor Lead",
    department: "HP Indigo Press Facility",
    twoFactorEnabled: true,
    lastActive: "4 mins ago",
    status: "active",
  },
  {
    id: "tm-4",
    name: "Ananya Deshmukh",
    email: "ananya.qc@perfectpic.in",
    role: "Quality Assurance Specialist",
    department: "Layflat Bindery QC",
    twoFactorEnabled: false,
    lastActive: "1 hour ago",
    status: "active",
  },
  {
    id: "tm-5",
    name: "Sneha Nair",
    email: "sneha.support@perfectpic.in",
    role: "Customer Concierge Lead",
    department: "Customer Experience",
    twoFactorEnabled: true,
    lastActive: "25 mins ago",
    status: "active",
  },
  {
    id: "tm-6",
    name: "Aditya Verma",
    email: "aditya.finance@perfectpic.in",
    role: "Financial Analyst",
    department: "Finance & Accounts",
    twoFactorEnabled: true,
    lastActive: "3 hours ago",
    status: "active",
  },
];

const permissionModules = [
  { id: "orders", label: "Orders 360° Management" },
  { id: "sla", label: "SLA Overrides & Escalations" },
  { id: "production", label: "Press Queue & Imposition" },
  { id: "qc", label: "QC Inspection & Rejection Pass" },
  { id: "shipping", label: "Courier Handover & NDR Resolution" },
  { id: "bundles", label: "Pricing & Volume Bundles" },
  { id: "finance", label: "Financial Ledger & Unit Economics" },
  { id: "audit", label: "System Security & Audit Logs" },
];

const roleMatrix: Record<string, Record<string, "FULL" | "READ" | "NONE">> = {
  "Super Admin": {
    orders: "FULL",
    sla: "FULL",
    production: "FULL",
    qc: "FULL",
    shipping: "FULL",
    bundles: "FULL",
    finance: "FULL",
    audit: "FULL",
  },
  "Operations Manager": {
    orders: "FULL",
    sla: "FULL",
    production: "READ",
    qc: "READ",
    shipping: "FULL",
    bundles: "READ",
    finance: "READ",
    audit: "READ",
  },
  "Production Floor Lead": {
    orders: "READ",
    sla: "FULL",
    production: "FULL",
    qc: "FULL",
    shipping: "READ",
    bundles: "NONE",
    finance: "NONE",
    audit: "NONE",
  },
  "Quality Assurance Specialist": {
    orders: "READ",
    sla: "READ",
    production: "READ",
    qc: "FULL",
    shipping: "NONE",
    bundles: "NONE",
    finance: "NONE",
    audit: "NONE",
  },
  "Customer Concierge Lead": {
    orders: "FULL",
    sla: "READ",
    production: "NONE",
    qc: "NONE",
    shipping: "FULL",
    bundles: "READ",
    finance: "NONE",
    audit: "NONE",
  },
  "Financial Analyst": {
    orders: "READ",
    sla: "READ",
    production: "NONE",
    qc: "NONE",
    shipping: "READ",
    bundles: "READ",
    finance: "FULL",
    audit: "READ",
  },
};

export default function TeamGovernancePage() {
  const [team, setTeam] = useState<TeamMember[]>(mockTeam);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    role: "Customer Concierge Lead",
    department: "Customer Experience",
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email) return;

    const created: TeamMember = {
      id: `tm-${Date.now()}`,
      name: newMember.name,
      email: newMember.email,
      role: newMember.role,
      department: newMember.department,
      twoFactorEnabled: false,
      lastActive: "Invited (Pending login)",
      status: "active",
    };

    setTeam((prev) => [...prev, created]);
    setInviteModalOpen(false);
    setNewMember({
      name: "",
      email: "",
      role: "Customer Concierge Lead",
      department: "Customer Experience",
    });
    alert(`Invitation dispatched to ${created.email} with temporary login credentials.`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-cream-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-foil-gold font-semibold">
              Corporate Governance & Access Control
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              RBAC Enforced
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-noir-900 tracking-tight">
            Team & Role Governance
          </h1>
          <p className="text-sm text-noir-600 mt-1 max-w-2xl">
            Role-Based Access Control (RBAC) matrix, administrative permission scoping, departmental accountability, and user provisioning.
          </p>
        </div>

        <button
          onClick={() => setInviteModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-cream-50 bg-noir-950 rounded hover:bg-noir-900 transition-colors shadow-sm self-start md:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Invite Team Member
        </button>
      </div>

      {/* Active Team Roster */}
      <div className="bg-white border border-cream-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-5 border-b border-cream-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-foil-gold" />
            <h2 className="font-serif text-lg text-noir-900 font-semibold">
              Authorized Team Members
            </h2>
          </div>
          <span className="text-xs font-mono text-noir-500">
            {team.length} Active Accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-cream-50/80 text-noir-600 border-b border-cream-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Name & Contact</th>
                <th className="py-3 px-4">Role & Permissions</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">2FA Security</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {team.map((member) => (
                <tr key={member.id} className="hover:bg-cream-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-sans">
                    <div className="font-semibold text-noir-950">{member.name}</div>
                    <div className="text-[11px] font-mono text-noir-500">{member.email}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-cream-100 text-noir-900 border border-cream-200">
                      {member.role}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-sans text-noir-700">
                    {member.department}
                  </td>

                  <td className="py-3.5 px-4">
                    {member.twoFactorEnabled ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" />
                        2FA Enforced
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Pending 2FA
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-noir-500 text-[11px]">
                    {member.lastActive}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => alert(`Opening permissions editor for ${member.name}`)}
                      className="text-xs text-foil-gold hover:underline font-mono"
                    >
                      Configure Scope
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role-Based Access Control (RBAC) Matrix */}
      <div className="bg-white border border-cream-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-5 border-b border-cream-200">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-foil-gold" />
            <h2 className="font-serif text-lg text-noir-900 font-semibold">
              RBAC Permission Matrix
            </h2>
          </div>
          <p className="text-xs text-noir-600">
            Granular read, write, and execute privileges across administrative functional domains.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-cream-50/80 text-noir-600 border-b border-cream-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Administrative Role</th>
                {permissionModules.map((m) => (
                  <th key={m.id} className="py-3 px-2 text-center whitespace-nowrap">
                    {m.label.split(" ")[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {Object.keys(roleMatrix).map((role) => (
                <tr key={role} className="hover:bg-cream-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-noir-950 font-sans">
                    {role}
                  </td>
                  {permissionModules.map((m) => {
                    const access = roleMatrix[role]?.[m.id] || "NONE";
                    return (
                      <td key={m.id} className="py-3.5 px-2 text-center">
                        <span
                          className={cn(
                            "inline-block px-1.5 py-0.5 rounded text-[9px] font-bold",
                            access === "FULL" && "bg-emerald-100 text-emerald-800",
                            access === "READ" && "bg-blue-100 text-blue-800",
                            access === "NONE" && "bg-cream-200 text-noir-400"
                          )}
                        >
                          {access}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-cream-50/60 border-t border-cream-200 text-xs text-noir-600 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-300" />
              <strong>FULL:</strong> Read, Write & Execute
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-blue-100 border border-blue-300" />
              <strong>READ:</strong> Inspection only
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-cream-200" />
              <strong>NONE:</strong> Route hidden
            </span>
          </div>
          <span className="text-[11px] font-mono text-noir-500">
            JWT Session Timeout: 8 Hours
          </span>
        </div>
      </div>

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-noir-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-luxury-xl max-w-md w-full border border-cream-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cream-200">
              <h3 className="font-serif text-lg font-bold text-noir-950">
                Invite New Team Member
              </h3>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="text-noir-400 hover:text-noir-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-noir-600 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="e.g. Maya Krishnan"
                  className="w-full px-3 py-2 border border-cream-300 rounded font-sans focus:outline-none focus:border-foil-gold"
                />
              </div>

              <div>
                <label className="block text-noir-600 mb-1">Company Email</label>
                <input
                  type="email"
                  required
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="maya@perfectpic.in"
                  className="w-full px-3 py-2 border border-cream-300 rounded font-sans focus:outline-none focus:border-foil-gold"
                />
              </div>

              <div>
                <label className="block text-noir-600 mb-1">Role Assignment</label>
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  className="w-full px-3 py-2 border border-cream-300 rounded font-sans focus:outline-none focus:border-foil-gold bg-white"
                >
                  {Object.keys(roleMatrix).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-noir-600 mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={newMember.department}
                  onChange={(e) => setNewMember({ ...newMember, department: e.target.value })}
                  placeholder="e.g. Customer Experience"
                  className="w-full px-3 py-2 border border-cream-300 rounded font-sans focus:outline-none focus:border-foil-gold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-3 py-2 border border-cream-300 text-noir-700 rounded hover:bg-cream-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-noir-950 text-cream-50 rounded hover:bg-noir-900 font-semibold uppercase tracking-wider"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
