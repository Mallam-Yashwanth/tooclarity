"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInstitution } from "@/lib/hooks/dashboard-hooks";
import { programsAPI } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { withAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import AppSelect from "@/components/ui/AppSelect";
import L2DialogBox from "@/components/auth/L2DialogBox";
import { getProgramStatus, formatDate } from "@/lib/utility";
import { useRouter } from "next/navigation";

function ProgramsPage() {
  const { data: institution } = useInstitution();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'details'|'add'>('details');
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("");
  const [addInlineMode, setAddInlineMode] = useState<'none'|'course'|'branch'>('none');
  const [visibleCount, setVisibleCount] = useState<number>(10);
  // Add/Branch forms are delegated to L2DialogBox for reuse across the app

  const { data: programs } = useQuery({
    queryKey: ['programs-page-list-institution-admin', institution?._id],
    enabled: !!institution?._id,
    queryFn: async () => {
      const res = await programsAPI.listForInstitutionAdminWithMetrics(String(institution?._id)) as any;
      return (res?.data?.programs || []) as Array<any>;
    },
    staleTime: 60*1000,
  });

  // Branch dropdown options - load from backend
  const { data: branchList } = useQuery({
    queryKey: ['programs-page-branches', institution?._id],
    enabled: !!institution?._id,
    queryFn: async () => {
      const res = await programsAPI.listBranchesForInstitutionAdmin(String(institution?._id)) as any;
      return (res?.data?.branches || []) as Array<any>;
    },
    staleTime: 5*60*1000,
  });

  const { data: invoices } = useQuery({
    queryKey: ['subscription-history', institution?._id],
    enabled: !!institution?._id,
    queryFn: async () => {
      const res = await programsAPI.subscriptionHistory(String(institution?._id)) as any;
      return (res?.data?.items || []) as Array<any>;
    },
    staleTime: 60*1000,
  });

  const onL2Success = () => {
    queryClient.invalidateQueries({ queryKey: ['programs-page-list-institution-admin'] });
    setActiveTab('details');
  };

  // Navigation function for edit button
  const handleEditProgram = (programId: string) => {
    router.push(`/dashboard/settings?editProgram=${programId}`);
  };

  const branchOptions = useMemo(() => {
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    const arr: Array<{ value: string; label: string }> = [{ value: '', label: 'All Branches' }];
    (branchList || []).forEach((b:any) => {
      const id = String(b?._id || "");
      if (!id || seenIds.has(id)) return;
      const label = (b.branchName || 'Branch').trim();
      const keyName = label.toLowerCase();
      if (seenNames.has(keyName)) return;
      seenIds.add(id);
      seenNames.add(keyName);
      arr.push({ value: id, label });
    });
    return arr.sort((a,b)=> a.label.localeCompare(b.label));
  }, [branchList]);

  // Reset visible count when filters change
  React.useEffect(()=>{ setVisibleCount(10); }, [search, branchFilter, activeTab]);

  const filteredPrograms = (Array.isArray(programs) ? programs : []).filter((p:any)=>{
    const q = search.trim().toLowerCase();
    const name = String(p.programName||"").toLowerCase();
    const branch = String(p.branchName || p.branch?.branchName || p.institution?.name || "").toLowerCase();
    const passSearch = !q || name.includes(q) || branch.includes(q);
    const branchId = typeof p.branch === 'object' && p.branch !== null ? String(p.branch._id || '') : String(p.branch || '');
    const passBranch = !branchFilter || branchFilter === '' || branchId === branchFilter;
    return passSearch && passBranch;
  });
  const visiblePrograms = filteredPrograms.slice(0, visibleCount);

  return (
    <div className="p-2 mt-5 space-y-6">
      {/* Card 1: Your Listed Programs */}
      <Card className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-2xl font-semibold">Your Listed Programs</div>
          </div>

          {/* Tabs header */}
          <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-800 mb-4 text-gray-900 dark:text-gray-100">
            <button onClick={()=>setActiveTab('details')} className={`py-2 px-1 ${activeTab==='details'?'border-b-2 border-blue-600 font-medium':'text-gray-500'}`}>Program Details</button>
            <button onClick={()=>setActiveTab('add')} className={`py-2 px-1 ${activeTab==='add'?'border-b-2 border-blue-600 font-medium':'text-gray-500'}`}>Add Program</button>
          </div>

          {/* Utilities row: search + filter */}
          {activeTab==='details' && (
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex-1">
              <Input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search program or branch" className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700" />
            </div>
            <div className="w-64">
              <AppSelect
                value={branchFilter}
                onChange={(val)=> setBranchFilter(val)}
                options={branchOptions}
                placeholder="Filter by Branch"
                variant="white"
                size="md"
                rounded="lg"
                className="w-full"
              />
            </div>
          </div>
          )}

          {/* Program Details table */}
          {activeTab==='details' && (
          <div className="overflow-x-auto">
            {Array.isArray(filteredPrograms) && filteredPrograms.length === 0 ? (
              <div className="py-10 text-center text-gray-500">No programs found yet.</div>
            ) : (
            <table className="min-w-full text-left">
              <thead className="text-gray-600 text-sm">
                <tr>
                  <th className="py-2 pr-4 w-16">S.No</th>
                  <th className="py-2 pr-4">Course Name</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Start Date</th>
                  <th className="py-2 pr-4">End Date</th>
                  <th className="py-2 pr-4">Leads Generated</th>
                  <th className="py-2 pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {visiblePrograms.map((p, idx) => (
                  <tr key={p._id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-4 pr-4">{String(idx+1).padStart(2,'0')}</td>
                    <td className="py-4 pr-4">
                      <div className="font-medium">{p.programName}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="opacity-60">◎</span> {p.branchName || p.branch?.branchName || 'Public'}
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      {(() => {
                        const status = getProgramStatus(p.startDate || '', p.endDate || '');
                        const statusColors = {
                          active: 'bg-green-100 text-green-700',
                          upcoming: 'bg-blue-100 text-blue-700',
                          expired: 'bg-red-100 text-red-700',
                          invalid: 'bg-gray-100 text-gray-700'
                        };
                        // Map status to match analytics page
                        const displayStatus = status.status === 'active' ? 'Live' : 
                                            status.status === 'upcoming' ? 'Paused' : 
                                            status.status === 'expired' ? 'Expired' : 
                                            'Draft';
                        return (
                          <span className={`inline-flex items-center text-xs rounded-full px-2 py-1 ${statusColors[status.status as keyof typeof statusColors]}`}>
                            ● {displayStatus}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-4 pr-4 text-sm">{formatDate(p.startDate || '')}</td>
                    <td className="py-4 pr-4 text-sm">{formatDate(p.endDate || '')}</td>
                    <td className="py-4 pr-4 text-sm">{typeof p.leadsGenerated==='number' ? p.leadsGenerated : 0}</td>
                    <td className="py-4 pr-4 text-sm">
                      <div className="flex items-center gap-3 text-gray-500">
                        <button title="Delete" onClick={async()=>{ try{ await programsAPI.remove(String(p._id), String(institution?._id)); queryClient.invalidateQueries({ queryKey: ['programs-page-list-institution-admin', institution?._id] }); }catch(e){} }} className="h-10 w-10 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center">
                          <img src="/Trash.png" alt="Delete" className="h-5 w-5 object-contain" />
                        </button>
                        <button title="Edit" onClick={() => handleEditProgram(String(p._id))} className="h-10 w-10 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center">
                          <img src="/Edit.png" alt="Edit" className="h-5 w-5 object-contain" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
            {Array.isArray(filteredPrograms) && filteredPrograms.length > visibleCount && (
              <div className="flex items-center justify-center py-5">
                <Button variant="outline" onClick={()=> setVisibleCount((c)=> c + 10)} className="rounded-full">View more ▾</Button>
              </div>
            )}
          </div>
          )}

          {/* Add Program tab */}
          {activeTab==='add' && (
            <div className="mt-6">
              {addInlineMode==='none' && (
                <div className="flex items-center justify-center gap-6 flex-wrap">
                  <button onClick={()=>setAddInlineMode('course')} className="rounded-2xl bg-blue-50/70 dark:bg-gray-800 border border-blue-100 dark:border-gray-700 flex flex-col items-center justify-center text-center w-[200px] h-[120px]">
                    <div className="h-12 w-12 rounded-full bg-white text-gray-700 flex items-center justify-center text-2xl mb-3">+</div>
                    <div className="text-gray-800 dark:text-gray-100 font-medium">Add Program</div>
                  </button>
                  <button onClick={()=>setAddInlineMode('branch')} className="rounded-2xl bg-blue-50/70 dark:bg-gray-800 border border-blue-100 dark:border-gray-700 flex flex-col items-center justify-center text-center w-[200px] h-[120px]">
                    <div className="h-12 w-12 rounded-full bg-white text-gray-700 flex items-center justify-center text-2xl mb-3">+</div>
                    <div className="text-gray-800 dark:text-gray-100 font-medium">Add Branch</div>
                  </button>
              </div>
            )}
              {addInlineMode!=='none' && (
                <div className="space-y-4">
                  <div>
                    <Button variant="outline" onClick={()=>setAddInlineMode('none')}>Back</Button>
                  </div>
                  <L2DialogBox
                    renderMode="inline"
                    initialSection={addInlineMode==='course' ? 'course' : 'branch'}
                    mode={addInlineMode==='course' ? 'subscriptionProgram' : 'default'}
                    institutionId={institution?._id}
                    onSuccess={()=>{ onL2Success(); setAddInlineMode('none'); }}
                    onPrevious={()=> setAddInlineMode('none')}
                  />
              </div>
            )}
          </div>
          )}

        </CardContent>
      </Card>

      {/* Card 2: Transaction History */}
      <Card className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
        <CardContent className="p-4 sm:p-6">
          <div className="text-2xl font-semibold mb-4">Transaction History</div>
          {/* Header row */}
          <div className="grid grid-cols-12 text-sm text-gray-600 px-3 pb-2">
            <div className="col-span-2 sm:col-span-1">S.No</div>
            <div className="col-span-4 sm:col-span-3">Invoice ID</div>
            <div className="col-span-3 sm:col-span-3">Date</div>
            <div className="col-span-3 sm:col-span-2">Plan type</div>
            <div className="hidden sm:block col-span-2">Amount</div>
            <div className="col-span-1 text-right">Action</div>
          </div>
          <div className="space-y-3">
            {Array.isArray(invoices) && invoices.length === 0 ? (
              <div className="py-6 text-center text-gray-500">No transactions found yet.</div>
            ) : (
            (invoices||[]).map((inv:any, idx:number)=> (
              <div key={inv._id || idx} className="grid grid-cols-12 items-center bg-white dark:bg-gray-900 rounded-xl px-3 py-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                <div className="col-span-2 sm:col-span-1 text-gray-700">{String(idx+1).padStart(2,'0')}</div>
                <div className="col-span-4 sm:col-span-3 font-medium text-gray-900">{inv.invoiceId}</div>
                <div className="col-span-3 sm:col-span-3 text-gray-700">{inv.date ? new Date(inv.date).toLocaleDateString('en-GB') : '—'}</div>
                <div className="col-span-3 sm:col-span-2 text-gray-700">{inv.planType || '—'}</div>
                <div className="hidden sm:block col-span-2 text-gray-900">{typeof inv.amount==='number' ? `₹ ${inv.amount.toFixed(2)}` : '—'}</div>
                <div className="col-span-1 flex justify-end">
                  <button title="Download" className="h-9 w-9 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center">⬇︎</button>
            </div>
          </div>
            ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default withAuth(ProgramsPage);


