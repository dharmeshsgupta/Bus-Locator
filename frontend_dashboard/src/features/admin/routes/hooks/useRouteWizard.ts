import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../../services/api/adminApi';
import toast from 'react-hot-toast';
import { routeDraftService } from '../../../../services/drafts/routeDraftService';

export interface RouteStop {
  id: string; // temporary frontend id
  stop_name: string;
  latitude: number;
  longitude: number;
  sequence_number: number;
  geofence_radius_meters: number;
}

export interface RouteSchedule {
  start_time: string;
  end_time: string;
  recurring_days: number[];
}

export function useRouteWizard(onSuccessCallback: () => void) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  // Form State
  const [routeInfo, setRouteInfo] = useState({
    route_name: '',
    route_code: '',
    start_location: '',
    end_location: '',
    expected_duration_mins: 45,
  });

  const [stops, setStops] = useState<RouteStop[]>([]);
  const [schedules, setSchedules] = useState<RouteSchedule[]>([]);
  const [busId, setBusId] = useState('');
  const [driverId, setDriverId] = useState('');

  // Load Draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      const draft = await routeDraftService.getDraft();
      if (draft) {
        if (window.confirm("A recovered draft was found. Do you want to restore it?")) {
          setRouteInfo(draft.routeInfo || routeInfo);
          setStops(draft.stops || []);
          setSchedules(draft.schedules || []);
          setBusId(draft.busId || '');
          setDriverId(draft.driverId || '');
          setCurrentStep(draft.currentStep || 1);
        } else {
          await routeDraftService.clearDraft();
        }
      }
      setIsDraftLoaded(true);
    };
    loadDraft();
  }, []);

  // Auto-save draft every 3 seconds if loaded and not submitting
  useEffect(() => {
    if (!isDraftLoaded) return;
    const interval = setInterval(async () => {
      await routeDraftService.saveDraft({
        routeInfo,
        stops,
        schedules,
        busId,
        driverId,
        currentStep
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [routeInfo, stops, schedules, busId, driverId, currentStep, isDraftLoaded]);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 6)); // Assume Step 3.5 added (so max is 6 now)
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        route: routeInfo,
        stops: stops.map((s, idx) => ({
          stop_name: s.stop_name,
          latitude: s.latitude,
          longitude: s.longitude,
          sequence_number: idx + 1,
          geofence_radius_meters: s.geofence_radius_meters,
        })),
        schedules: schedules,
        bus_id: busId || null,
        driver_id: driverId || null,
      };
      return adminApi.createCompleteRoute(payload); // adminApi method may need renaming or we use it as is since it points to /wizard
    },
    onSuccess: async () => {
      toast.success('Route created successfully!');
      await routeDraftService.clearDraft();
      queryClient.invalidateQueries({ queryKey: ['admin-routes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stops'] });
      queryClient.invalidateQueries({ queryKey: ['admin-buses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
      onSuccessCallback();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to create route');
    },
  });

  const submit = () => {
    createMutation.mutate();
  };

  return {
    currentStep,
    nextStep,
    prevStep,
    routeInfo,
    setRouteInfo,
    stops,
    setStops,
    schedules,
    setSchedules,
    busId,
    setBusId,
    driverId,
    setDriverId,
    submit,
    isSubmitting: createMutation.isPending,
  };
}
