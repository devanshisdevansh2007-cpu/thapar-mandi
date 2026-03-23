import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { parseWithLogging } from "@/lib/api-utils";
import { z } from "zod";

type CreateItemInput = z.infer<typeof api.items.create.input>;
type UpdateItemInput = z.infer<typeof api.items.update.input>;

export function useItems(search?: string) {
  return useQuery({
    queryKey: [api.items.list.path, search],
    queryFn: async () => {
      const url = new URL(api.items.list.path, window.location.origin);
      if (search) url.searchParams.set("search", search);
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch items");
      const data = await res.json();
      return parseWithLogging(api.items.list.responses[200], data, "items.list");
    },
  });
}

export function useMyListings() {
  return useQuery({
    queryKey: ["my-listings"],
    queryFn: async () => {
      const res = await fetch("/api/my-listings", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch your listings");
      }

      return res.json();
    },
  });
}

export function useItem(id: number) {
  return useQuery({
    queryKey: [api.items.get.path, id],
    queryFn: async () => {
      if (!id || isNaN(id)) return null;
      const url = buildUrl(api.items.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch item");
      const data = await res.json();
      return parseWithLogging(api.items.get.responses[200], data, "items.get");
    },
    enabled: !!id,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateItemInput) => {
      const validated = api.items.create.input.parse(data);
      const res = await fetch(api.items.create.path, {
        method: api.items.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create item");
      const result = await res.json();
      return parseWithLogging(api.items.create.responses[201], result, "items.create");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.items.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.items.myListings.path] });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateItemInput }) => {
      const validated = api.items.update.input.parse(updates);
      const url = buildUrl(api.items.update.path, { id });
      const res = await fetch(url, {
        method: api.items.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update item");
      const result = await res.json();
      return parseWithLogging(api.items.update.responses[200], result, "items.update");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.items.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.items.myListings.path] });
      queryClient.invalidateQueries({ queryKey: [api.items.get.path, variables.id] });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.items.delete.path, { id });
      const res = await fetch(url, {
        method: api.items.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.items.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.items.myListings.path] });
    },
  });
}
