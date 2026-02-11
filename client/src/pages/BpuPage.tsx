import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, FileText, Euro, ChevronLeft, ChevronRight, Package } from "lucide-react";

export default function BpuPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const limit = 25;

  const { data: categories } = trpc.bpu.categories.useQuery();
  const { data, isLoading } = trpc.bpu.list.useQuery({
    category: category || undefined,
    search: search || undefined,
    page,
    limit,
  });

  const totalPages = useMemo(() => Math.ceil((data?.total ?? 0) / limit), [data?.total]);

  const formatPrice = (price: string | number) => {
    const num = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(num);
  };

  const categoryColors: Record<string, string> = {
    "CVC": "bg-blue-100 text-blue-800",
    "Protection incendie": "bg-red-100 text-red-800",
    "Sécurité incendie": "bg-orange-100 text-orange-800",
    "Clos et couvert": "bg-amber-100 text-amber-800",
    "Électricité CF": "bg-yellow-100 text-yellow-800",
    "Fermetures motorisées": "bg-purple-100 text-purple-800",
    "Plomberie": "bg-cyan-100 text-cyan-800",
    "Éclairage": "bg-indigo-100 text-indigo-800",
    "Second-œuvre": "bg-teal-100 text-teal-800",
    "Extincteurs": "bg-rose-100 text-rose-800",
    "Amiante": "bg-gray-100 text-gray-800",
    "Moyens d'accès": "bg-emerald-100 text-emerald-800",
    "Management énergie": "bg-green-100 text-green-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bordereau de Prix Unitaires</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lot 4.1 Occitanie — Mission D — {data?.total ?? 0} prestations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Package className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par code ou description..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Select value={category} onValueChange={(v) => { setCategory(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[120px] font-semibold">Code</TableHead>
                  <TableHead className="w-[160px] font-semibold">Catégorie</TableHead>
                  <TableHead className="font-semibold">Prestation</TableHead>
                  <TableHead className="w-[130px] text-right font-semibold">Prix HT</TableHead>
                  <TableHead className="w-[140px] font-semibold">Unité</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <div className="h-6 bg-muted animate-pulse rounded" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : data?.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      Aucune prestation trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setSelectedItem(item)}
                    >
                      <TableCell>
                        <span className="font-mono text-sm font-medium text-primary">{item.code}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs ${categoryColors[item.category] || "bg-gray-100 text-gray-800"}`}>
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm line-clamp-2">{item.name}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-sm">{formatPrice(item.priceHT)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{item.unit || "—"}</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} sur {totalPages} ({data?.total} résultats)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Suivant <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog détail */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="font-mono text-primary">{selectedItem?.code}</span>
              <Badge variant="secondary" className={categoryColors[selectedItem?.category] || ""}>
                {selectedItem?.category}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Prestation</h4>
              <p className="text-sm">{selectedItem?.name}</p>
            </div>
            {selectedItem?.detail && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Détail</h4>
                <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">{selectedItem.detail}</p>
              </div>
            )}
            <div className="flex gap-8">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Prix HT</h4>
                <p className="text-2xl font-bold text-primary">{selectedItem && formatPrice(selectedItem.priceHT)}</p>
              </div>
              {selectedItem?.unit && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Unité</h4>
                  <p className="text-sm">{selectedItem.unit}</p>
                </div>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Lot</h4>
              <p className="text-sm">Lot {selectedItem?.lotCode}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
