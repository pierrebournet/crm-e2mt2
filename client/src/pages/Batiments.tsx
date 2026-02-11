import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Search, Plus, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PORTFOLIOS } from "../../../shared/e2mt2";

export default function Batiments() {
  const [lotId, setLotId] = useState<number | undefined>(undefined);
  const [portfolio, setPortfolio] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: lotsData } = trpc.lots.list.useQuery();
  const { data, isLoading, refetch } = trpc.buildings.list.useQuery({
    lotId,
    portfolio,
    search: search || undefined,
    page,
    limit: 20,
  });

  const createMutation = trpc.buildings.create.useMutation({
    onSuccess: () => {
      toast.success("Bâtiment créé avec succès");
      setDialogOpen(false);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const [form, setForm] = useState({
    name: "",
    code: "",
    lotId: 0,
    portfolio: "" as any,
    address: "",
    surface: "",
    description: "",
  });

  const handleCreate = () => {
    if (!form.name || !form.lotId || !form.portfolio) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }
    createMutation.mutate(form);
  };

  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bâtiments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.total ?? 0} bâtiment(s) dans le patrimoine
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0C1E3C] hover:bg-[#162d52]">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un bâtiment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouveau bâtiment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom du bâtiment" />
                </div>
                <div>
                  <Label>Code</Label>
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Code bâtiment" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Lot géographique *</Label>
                  <Select value={form.lotId ? String(form.lotId) : ""} onValueChange={(v) => setForm({ ...form, lotId: Number(v) })}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      {lotsData?.map((lot: any) => (
                        <SelectItem key={lot.id} value={String(lot.id)}>{lot.code} - {lot.region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Portefeuille *</Label>
                  <Select value={form.portfolio} onValueChange={(v) => setForm({ ...form, portfolio: v })}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      {PORTFOLIOS.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Adresse</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Adresse complète" />
              </div>
              <div>
                <Label>Surface (m²)</Label>
                <Input value={form.surface} onChange={(e) => setForm({ ...form, surface: e.target.value })} placeholder="Ex: 1500.00" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description du bâtiment" rows={3} />
              </div>
              <Button onClick={handleCreate} className="w-full bg-[#0C1E3C] hover:bg-[#162d52]" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Création..." : "Créer le bâtiment"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou code..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 bg-white"
              />
            </div>
            <Select value={lotId ? String(lotId) : "all"} onValueChange={(v) => { setLotId(v === "all" ? undefined : Number(v)); setPage(1); }}>
              <SelectTrigger className="w-[200px] bg-white"><SelectValue placeholder="Tous les lots" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les lots</SelectItem>
                {lotsData?.map((lot: any) => (
                  <SelectItem key={lot.id} value={String(lot.id)}>{lot.code} - {lot.region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={portfolio || "all"} onValueChange={(v) => { setPortfolio(v === "all" ? undefined : v); setPage(1); }}>
              <SelectTrigger className="w-[180px] bg-white"><SelectValue placeholder="Portefeuille" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les portefeuilles</SelectItem>
                {PORTFOLIOS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Buildings List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5"><div className="h-24 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : data?.items && data.items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map((b: any) => (
              <Card key={b.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#0C1E3C]/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-[#0C1E3C]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{b.name}</h3>
                        {b.code && <p className="text-xs text-muted-foreground">{b.code}</p>}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-muted font-medium">{b.portfolio}</span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>Lot {b.lotCode} - {b.lotRegion}</span>
                    </div>
                    {b.address && (
                      <p className="text-xs text-muted-foreground truncate">{b.address}</p>
                    )}
                    {b.surface && (
                      <p className="text-xs text-muted-foreground">{b.surface} m²</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} / {totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-lg">Aucun bâtiment trouvé</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Ajoutez votre premier bâtiment ou modifiez vos filtres de recherche.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
