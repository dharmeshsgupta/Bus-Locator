export const authKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authKeys.all, 'currentUser'] as const,
};

export const routeKeys = {
  all: ['routes'] as const,
  lists: () => [...routeKeys.all, 'list'] as const,
  list: (filters: string) => [...routeKeys.lists(), { filters }] as const,
  details: () => [...routeKeys.all, 'detail'] as const,
  detail: (id: string) => [...routeKeys.details(), id] as const,
};

export const busKeys = {
  all: ['buses'] as const,
  lists: () => [...busKeys.all, 'list'] as const,
  list: (filters: string) => [...busKeys.lists(), { filters }] as const,
  details: () => [...busKeys.all, 'detail'] as const,
  detail: (id: string) => [...busKeys.details(), id] as const,
};

export const trackingKeys = {
  all: ['tracking'] as const,
  route: (routeId: string) => [...trackingKeys.all, 'route', routeId] as const,
};
