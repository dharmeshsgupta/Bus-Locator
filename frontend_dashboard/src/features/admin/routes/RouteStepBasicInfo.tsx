import React from 'react';

export function RouteStepBasicInfo({ routeInfo, setRouteInfo }: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Route Name *</label>
        <input required value={routeInfo.route_name} onChange={e => setRouteInfo({...routeInfo, route_name: e.target.value})}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="e.g. North Campus Express" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Route Code *</label>
        <input required value={routeInfo.route_code} onChange={e => setRouteInfo({...routeInfo, route_code: e.target.value})}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="e.g. NCE-01" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Location *</label>
          <input required value={routeInfo.start_location} onChange={e => setRouteInfo({...routeInfo, start_location: e.target.value})}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="Main Gate" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Location *</label>
          <input required value={routeInfo.end_location} onChange={e => setRouteInfo({...routeInfo, end_location: e.target.value})}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="Library" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expected Duration (mins)</label>
        <input type="number" value={routeInfo.expected_duration_mins} onChange={e => setRouteInfo({...routeInfo, expected_duration_mins: parseInt(e.target.value) || 0})}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="45" />
      </div>
    </div>
  );
}
